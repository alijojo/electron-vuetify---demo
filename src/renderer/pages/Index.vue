<template>
  <v-layout row wrap justify-center id="wrapper">
    <v-layout row wrap justify-center align-center>
      <v-flex xs8 sm4>
        <v-menu lazy :close-on-content-click="false" v-model="menu_1" transition="scale-transition" offset-y full-width :nudge-right="40" max-width="290px" min-width="290px">
          <v-text-field slot="activator" label="选择开始日期" v-model="time_1" prepend-icon="event" readonly></v-text-field>
          <v-date-picker v-model="time_1" no-title scrollable actions></v-date-picker>
        </v-menu>
      </v-flex>
      <v-flex xs8 sm4>
        <v-menu lazy :close-on-content-click="false" v-model="menu_2" transition="scale-transition" offset-y full-width :nudge-right="40" max-width="290px" min-width="290px">
          <v-text-field slot="activator" label="选择结束日期" v-model="time_2" prepend-icon="event" readonly></v-text-field>
          <v-date-picker v-model="time_2" no-title scrollable actions></v-date-picker>
        </v-menu>
      </v-flex>
      <v-flex xs4 sm2 pl-4>
        <v-select :items="states" item-text="text" item-value="value" v-model="e" single-line auto append-icon="map" hide-details></v-select>
      </v-flex>
    </v-layout>
    <v-flex xs10 mt-4>
      <v-card>
        <v-card-title class="headline">咔咔下载器</v-card-title>
        <v-divider></v-divider>
        <v-card-actions class="pt-3 pb-3">
          <v-spacer></v-spacer>
          <v-btn class="link-btn" @click="runType = 'underway'" v-if="runType === 'stop'">开始</v-btn>
          <v-btn class="link-btn" @click="runType = 'pause'" v-if="runType === 'underway'">暂停</v-btn>
          <v-btn class="link-btn" @click="runType = 'underway'" v-if="runType === 'pause'">继续</v-btn>
          <v-spacer></v-spacer>
          <v-btn class="link-btn" @click="runType = 'stop'">停止</v-btn>
          <!-- <v-spacer></v-spacer> -->
          <!-- <v-btn class="link-btn" @click.native="test">测试</v-btn> -->
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-flex>
    <v-flex xs10 mt-4>
      <v-card color="blue-grey darken-2" class="dark--text">
        <v-card-title primary-title>
          <div class="headline">日志</div>
          <div>
            <template v-for="(log, index) of logs">{{ log }}<br/></template>
          </div>
        </v-card-title>
        <v-card-actions>
          <v-btn flat @click="logs = []">Clean logs</v-btn>
        </v-card-actions>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
const SSH = require('ssh2')
const PATH = require('path')
const FS = require('fs-extra')
const SCHEDULE = require('node-schedule')
const DATE_FORMAT = require('dateformat')
const config = require('../../../config')
const remoteBasePath = '/data/htdocs/Insurance/Public/upload/camera'
let localBasePath = ''

const getTimeRange = (startDay = 0, endDay = startDay) => {
  const end = new Date()
  const start = new Date()
  end.setTime(end.getTime() - 3600 * 1000 * 24 * endDay)
  start.setTime(start.getTime() - 3600 * 1000 * 24 * startDay)
  return [
    DATE_FORMAT(start.toLocaleDateString(), 'yyyy-mm-dd'),
    DATE_FORMAT(end.toLocaleDateString(), 'yyyy-mm-dd')
  ]
}
let timeRange = getTimeRange()

export default {
  name: 'index',
  data() {
    return {
      time_1: null,
      time_2: null,
      menu_1: false,
      menu_2: false,
      states: [
        {value: '2017-1', text: '今天'},
        {value: 'a', text: '昨天'}
      ],
      e: 'a',
      // items: [
      //   { text: 'State 1' },
      //   { text: 'State 2' },
      //   { text: 'State 3' },
      //   { text: 'State 4' },
      //   { text: 'State 5' },
      //   { text: 'State 6' },
      //   { text: 'State 7' }
      // ],
      logs: [], // 存放日志信息
      sftp: null, // 当前连接的sftp实例
      runType: 'stop', // 当前程序运行的状态 underway:下载中 pause:暂停 stop:停止
      thread: { main: null } // 直接根目录下的文件在主线程main跑, 非直接根目录下的文件(文件夹下的文件)在新开的线程跑
    }
  },
  computed: {
    timeBegin() { // 开始时间
      return DATE_FORMAT(`${this.time_1 || timeRange[0]} 00:00:00`, 'yyyy-mm-dd HH:MM:ss')
    },
    timeEnd() { // 结束时间
      return DATE_FORMAT(`${this.time_2 || timeRange[1]} 19:00:00`, 'yyyy-mm-dd HH:MM:ss')
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
    log_sucs(filename) {
      let content = `Log :: download success! 文件名:${filename}创建时间:${new Date().toLocaleString()}`
      this.logs.unshift(content)
      console.log('%c%s', 'color: green', content)
    },
    f_time: (timestamp, ratio = 1) => DATE_FORMAT(new Date(timestamp * ratio).toLocaleString(), 'yyyy-mm-dd HH:MM:ss'),
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
      if (this.isTimeRange(mtime) && filename !== 'redis.txt') {
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
    downloadRedis() {
      const localfile = `${localBasePath}${PATH.sep}redis.txt`
      const remoteFile = `${remoteBasePath}/redis.txt`

      this.sftp.readFile(remoteFile, (err, data) => {
        if (err) throw err

        let reg = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/g
        let content = data.toString()
        let tempObj = {}
        let tempArr = content.split(reg).slice(1)
        let keys = content.match(reg)
        if (keys)
          tempArr = tempArr.map((v, i) => {
            const value = keys[i] + v
            const key = keys[i].split(' ')[0]
            tempObj[key] = value
            return value
          })

        const key = this.timeEnd.split(' ')[0]
        FS.ensureFile(localfile)
          .then(() => {
            FS.outputFile(localfile, tempObj[key], (err) => {
              if (err) throw err
              console.info('%c%s', 'color: green', `Log :: 写入文件 ${localfile} 成功!`)
            })
          })
          .catch(err => console.error(err))
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

      this.connectSFTP(() => {
        this.download()
        this.downloadRedis()
      })
    },
    test() {
      this.connectSFTP(() => {

      })
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>
