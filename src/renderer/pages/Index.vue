<template>
  <v-layout row wrap justify-center id="wrapper">
    <v-flex xs10 class="mt-4">
      <v-card>
        <v-card-title class="headline">XX</v-card-title>
        <v-divider></v-divider>
        <v-card-actions class="pt-3 pb-3">
          <v-spacer></v-spacer>
          <!-- <v-btn class="link-btn">button1</v-btn>
              <v-spacer></v-spacer>
              <v-btn class="link-btn">button2</v-btn>
              <v-spacer></v-spacer>
              <v-btn class="link-btn">button3</v-btn> -->
          <div>
            <template v-for="(log, index) of logs">{{ log }}<br/></template>
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

window.DATE_FORMAT = DATE_FORMAT

let localBasePath = ''
const remoteBasePath = '/data/htdocs/Insurance/Public/upload/camera'
const hostInfo = require('../../../config')

export default {
  name: 'index',
  data() {
    return {
      hostInfo,
      logs: [], // 存放日志信息
      mode: { // UNIX系统下文件的权限代号, 这里用来判断是目录 或 文件
        // file: 33204,
        // folder: 16893
        file: 33188,
        folder: 16895
      },
      sftp: null,
      mainRun: null, // 主线程
      childRun: {}, // 存在目录时, 会在子线程里跑
      timeBegin: '',
      timeEnd: ''
    }
  },
  mounted() {
    // this.init()
    SCHEDULE.scheduleJob('0 10 19 * * *', () => this.init()) // 每天下午 19:10 定时任务开启
  },
  methods: {
    log_sucs: filename => console.log('%c%s', 'color: green', 'Log :: download success!', '文件名:', filename, ',创建时间:', new Date().toLocaleString()),
    f_time: (timestamp, ratio = 1) => DATE_FORMAT(new Date(timestamp * ratio).toLocaleString(), 'yyyy-mm-dd HH:MM:ss'),
    toGetTimeRange(startDay, endDay = 1) {
      const end = new Date()
      const start = new Date()
      end.setTime(end.getTime() - 3600 * 1000 * 24 * ~~endDay)
      start.setTime(start.getTime() - 3600 * 1000 * 24 * (~~startDay + 1))

      const formatPicker = (s, r, t = '-') => s.toLocaleDateString().replace(/\//g, t) + (r ? ' 00:00:00' : ' 19:00:59')
      return [
        DATE_FORMAT(new Date(start), 'yyyy-mm-dd HH:MM:ss'),
        DATE_FORMAT(end, 'yyyy-mm-dd HH:MM:ss')
      ]
    },
    is_time_range(time) { // 时间范围判断
      time = time.replace(/\D+/g, '')
      let begin = this.timeBegin.replace(/\D+/g, '')
      let end = this.timeEnd.replace(/\D+/g, '')

      if (time >= begin && time <= end)
        return true
      return false
    },
    add_queue({ filename, attrs: { mtime } }, parent, resolve) {
      const remoteFile = remoteBasePath + parent + '/' + filename
      const localFile = localBasePath + parent + '/' + filename

      if (!FS.pathExistsSync(PATH.dirname(localFile))) { // 不存在此目录的话就创建一个
        FS.ensureDirSync(PATH.dirname(localFile))
      }

      let mTime = this.f_time(mtime, 1000)
      // resolve('debug!')
      if (this.is_time_range(mTime)) {
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
    * request(filelist, parent) {
      for (let i = 0; i < filelist.length; ++i) {
        if (this.mode.folder === filelist[i].attrs.mode) { // 是目录
          this.download(parent + '/' + filelist[i].filename)
        } else { // 是文件
          yield this.req(filelist[i], parent)
        }
      }
    },
    req(filelist, parent) {
      // new Promise(resolve => this.add_queue(filelist, parent, resolve))
      //   .then(data => parent === '' ? this.mainRun.next(data) : this.childRun[parent].next(data))
      //   .catch(err => console.error(err))
      new Promise(resolve => this.add_queue(filelist, parent, resolve))
        .then(data => {
          // this.logs.unshift(this.childRun[parent])
          // console.warn(filelist, parent)
          if (parent === '')
            this.mainRun.next(data)
          else
            this.childRun[parent].next(data)
        })
        .catch(err => console.error(err))
    },
    download(path = '') {
      this.sftp.readdir(remoteBasePath + path, (err, list) => {
        if (err) throw err

        if (path === '') {
          this.mainRun = this.request(list, path)
          this.mainRun.next()
        } else {
          this.childRun[path] = this.request(list, path)
          this.childRun[path].next()
        }
      })
    },
    init() {
      let Client = new SSH.Client()
      let timeRange = this.toGetTimeRange(-1, 0)
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
      }).connect(this.hostInfo)
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>
