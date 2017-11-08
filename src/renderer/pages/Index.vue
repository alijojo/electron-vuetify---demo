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
    return {
      logs: [], // 存放日志信息
      runType: 'stop',
      sftp: null,
      mainRun: null, // 主线程
      childRun: {}, // 存在目录时, 会在子线程里跑
      timeBegin: '',
      timeEnd: ''
    }
  },
  watch: {
    runType(newVal, oldVal) {
      switch (newVal) {
        case 'underway': // 正在下载进行时
          if (oldVal === 'stop') // 从[开始]点过来的
            this.init()
          // else // 从[继续]点过来的
          break
        case 'pause': // 下载暂停

          break
        case 'stop': // 下载停止
          this.sftp.end()
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

      let mTime = this.f_time(mtime, 1000)
      if (this.isTimeRange(mTime)) {
        this.sftp.fastGet(remoteFile, PATH.normalize(localFile), (err, list) => {
          resolve && resolve('success!')
          if (err) throw err

          this.log_sucs(filename)
          // this.log_sucs(mTime + filename)
        })
      } else {
        resolve && resolve('success!')
      }
    },
    req(filelist, parent) {
      new Promise(resolve => this.addQueue(filelist, parent, resolve))
        .then(data => {
          parent === ''
            ? this.mainRun.next(data) // 直接根目录下的文件在主线程跑
            : this.childRun[parent].next(data) // 非直接根目录下的文件(文件夹下的文件)在子线程跑
        })
        .catch(err => console.error(err))
    },
    * eachFilelist(filelist, parent) {
      for (let i = 0; i < filelist.length; ++i) {
        if (config.mode.file === filelist[i].attrs.mode) { // 是文件
          yield this.req(filelist[i], parent)
        } else { // 是目录
          this.download(parent + '/' + filelist[i].filename)
        }
      }
    },
    download(path = '') {
      this.sftp.readdir(remoteBasePath + path, (err, list) => {
        if (err) throw err

        if (path === '') {
          this.mainRun = this.eachFilelist(list, path)
          this.mainRun.next()
        } else {
          this.childRun[path] = this.eachFilelist(list, path)
          this.childRun[path].next()
        }
      })
    },
    init() {
      let Client = new SSH.Client()
      let timeRange = this.getTimeRange() // 今天
      this.timeBegin = timeRange[0]
      this.timeEnd = timeRange[1]
      localBasePath = PATH.resolve('F:\\统计数据\\' + timeRange[0].split(' ')[0]) // 根据今天日期生成目录

      Client.on('ready', () => {
        console.info('Log :: ready...')

        Client.sftp((err, sftp) => {
          if (err) throw err

          this.sftp = sftp
          this.download()
        })
      }).connect(config.hostInfo)
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>
