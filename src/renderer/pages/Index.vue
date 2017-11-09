<template>
  <v-layout row wrap justify-center id="wrapper">
    <v-flex xs10 class="mt-4">
      <v-card>
        <v-card-title class="headline">咔咔下载器</v-card-title>
        <v-divider></v-divider>
        <v-card-actions class="pt-3 pb-3">
          <v-spacer></v-spacer>
          <v-btn class="link-btn" @click.native="runType = 'underway'" v-if="runType === 'stop'">开始</v-btn>
          <v-btn class="link-btn" @click.native="runType = 'pause'" v-if="runType === 'underway'">暂停</v-btn>
          <v-btn class="link-btn" @click.native="runType = 'underway'" v-if="runType === 'pause'">继续</v-btn>
          <v-spacer></v-spacer>
          <v-btn class="link-btn" @click.native="runType = 'stop'">停止</v-btn>
          <v-spacer></v-spacer>
          <v-btn class="link-btn" @click.native="test">测试</v-btn>
          <div>
            <!-- <template v-for="(log, index) of logs">{{ log }}<br/></template> -->
          </div>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
let SSH = require('ssh2')
let PATH = require('path')
let FS = require('fs-extra')
let SCHEDULE = require('node-schedule')
let DATE_FORMAT = require('dateformat')

let localBasePath = ''
const remoteBasePath = '/data/htdocs/Insurance/Public/upload/camera'
const config = require('../../../config')

export default {
  name: 'index',
  data() {
    let timeRange = this.getTimeRange() // 今天
    return {
      logs: [], // 存放日志信息
      sftp: null, // 当前连接的sftp实例
      runType: 'stop', // 当前程序运行的状态 underway:下载中 pause:暂停 stop:停止
      thread: { main: null }, // 直接根目录下的文件在主线程main跑, 非直接根目录下的文件(文件夹下的文件)在新开的线程跑
      timeBegin: timeRange[0], // 开始时间
      timeEnd: timeRange[1] // 结束时间
    }
  },
  watch: {
    runType(newVal, oldVal) {
      switch (newVal) {
        case 'underway': // 正在下载进行时
          oldVal === 'stop'
            ? this.init() // 从[开始]点过来的
            : Object.values(this.thread).forEach(v => v.next()) // 从[继续]点过来的
          break
        case 'pause': // 下载暂停
          break
        case 'stop': // 下载停止
          this.sftp.end()
          this.thread = { main: null }
          break
        default:
          break
      }
    }
  },
  mounted() {
    SCHEDULE.scheduleJob('0 10 19 * * *', () => this.init()) // 每天下午 19:10 定时任务开启
  },
  methods: {
    log_sucs: filename => console.log('%c%s', 'color: green', 'Log :: download success!', '文件名:', filename, ',创建时间:', new Date().toLocaleString()),
    f_time: (timestamp, ratio = 1) => DATE_FORMAT(new Date(timestamp * ratio).toLocaleString(), 'yyyy-mm-dd HH:MM:ss'),
    getTimeRange: (startDay = 0, endDay = startDay) => {
      const end = new Date()
      const start = new Date()
      end.setTime(end.getTime() - 3600 * 1000 * 24 * endDay)
      start.setTime(start.getTime() - 3600 * 1000 * 24 * startDay)
      return [
        DATE_FORMAT(start.toLocaleDateString() + ' 00:00:00', 'yyyy-mm-dd HH:MM:ss'),
        DATE_FORMAT(end.toLocaleDateString() + ' 19:00:00', 'yyyy-mm-dd HH:MM:ss')
      ]
    },
    isTimeRange(time) { // 时间范围判断
      time = time.replace(/\D+/g, '')
      let begin = this.timeBegin.replace(/\D+/g, '')
      let end = this.timeEnd.replace(/\D+/g, '')

      if (time >= begin && time <= end)
        return true
      return false
    },
    addQueue({ filename, attrs: { mtime, mode } }, parent, resolve) {
      const remoteFile = remoteBasePath + parent + '/' + filename
      const localFile = localBasePath + parent + '/' + filename

      if (!FS.pathExistsSync(PATH.dirname(localFile))) { // 不存在此目录的话就创建一个
        FS.ensureDirSync(PATH.dirname(localFile))
      }

      mtime = this.f_time(mtime, 1000)
      if (this.isTimeRange(mtime) || filename.indexOf('redis.txt') > -1) {
        this.sftp.fastGet(remoteFile, PATH.normalize(localFile), (err, list) => {
          resolve && resolve('success!')
          if (err) throw err

          this.log_sucs(filename)
          // this.log_sucs(mtime + filename)
        })
      } else {
        resolve && resolve('success!')
      }
    },
    * req(filelist, parent) {
      if (this.runType === 'pause') {
        // console.warn(filelist.filename)
        yield 'pause'
      }
      yield new Promise(resolve => this.addQueue(filelist, parent, resolve))
        .then(data => {
          if (parent === '') parent = 'main'
          this.thread[parent].next(data)
        })
        .catch(err => console.error(err))
    },
    * eachFilelist(filelist, parent) {
      for (let i = 0; i < filelist.length; ++i)
        config.mode.file === filelist[i].attrs.mode
          ? yield * this.req(filelist[i], parent) // 是文件
          : this.download(parent + '/' + filelist[i].filename) // 是目录
    },
    download(path = '') {
      this.sftp.readdir(remoteBasePath + path, (err, list) => {
        if (err) throw err

        let promise = path === ''
          ? (this.thread['main'] = this.eachFilelist(list, path)).next()
          : (this.thread[path] = this.eachFilelist(list, path)).next()
      })
    },
    connectSFTP(callback) {
      let Client = new SSH.Client()

      Client.on('ready', () => {
        console.info('Log :: ready...')

        Client.sftp((err, sftp) => {
          if (err) throw err
          this.sftp = sftp
          callback(err, sftp)
        })
      }).connect(config.hostInfo)
    },
    init() {
      localBasePath = PATH.resolve('F:\\统计数据\\' + this.timeBegin.split(' ')[0]) // 根据今天日期生成目录
      this.connectSFTP(() => this.download())
    },
    test() {
      this.connectSFTP(() => {
        this.sftp.readFile(remoteBasePath + '/redis.txt', (err, data) => {
          if (err) throw err
          let content = data.toString()
          let tempArr = content.split(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/)
          if (tempArr.length > 1)
            content = this.timeEnd + tempArr[tempArr.length - 1]
          // FS
        })
      })
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>
