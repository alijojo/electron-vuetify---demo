<template>
  <v-layout row wrap justify-center id="wrapper">
    <v-flex xs10 class="mt-4">
      <v-card>
        <v-card-title class="headline">Docs</v-card-title>
        <!-- <v-divider></v-divider> -->
        <!-- <v-card-actions class="pt-3 pb-3">
                                                                                    <v-spacer></v-spacer>
                                                                                    <v-btn class="link-btn" @click="open('https://vuejs.org/v2/guide/')">Vue</v-btn>
                                                                                    <v-spacer></v-spacer>
                                                                                    <v-btn class="link-btn" @click="open('https://electron.atom.io/docs/')">Electron</v-btn>
                                                                                    <v-spacer></v-spacer>
                                                                                    <v-btn class="link-btn" @click="open('https://vuetifyjs.com')">Vuetify</v-btn>
                                                                                    <v-spacer></v-spacer>
                                                                                  </v-card-actions> -->
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
let SSH = require('ssh2')
let PATH = require('path')
let FS = require('fs-extra')

const remoteBasePath = '/data/htdocs/ycbb/Insurance/Public/static/packaged-assets/WX_CarLoan/testp'
const localBasePath = PATH.resolve('./.load')

export default {
  name: 'index',
  data() {
    return {
      // remoteBasePath,
      // localBasePath,
      hostInfo: {
        host: '182.254.240.237',
        port: 22,
        username: 'ubuntu',
        password: 'qrVCeAtkc4keji'
      },
      mode: { // UNIX系统下文件的权限代号, 这里用来判断是目录or文件
        file: 33204,
        folder: 16893
      },
      sftp: null,
      mainRun: null, // 主线程
      childRun: {}, // 存在目录时, 会在子线程里跑
      timeBegin: '',
      timeEnd: ''
    }
  },
  mounted() {
    let timeRange = this.toGetTimeRange(0)
    this.timeBegin = timeRange[0]
    this.timeEnd = timeRange[1]
    this.init()
  },
  methods: {
    log_sucs: filename => console.log('%c%s', 'color: green', 'Log :: download success!', '文件名:', filename, ',创建时间:', new Date().toLocaleString()),
    prefix_integer: (num, n) => (Array(n).join(0) + num).slice(-n), // 对任意数字进行补 0
    f_time(timestamp, ratio = 1) {
      return this.date_fill_zero(new Date(timestamp * ratio).toLocaleString())
    },
    date_fill_zero(date) { // 对不满两位数日期补 0
      let temp = date.split(' ')
      date = temp[0].split('-')

      date[1] = this.prefix_integer(date[1], 2)
      date[2] = this.prefix_integer(date[2], 2)
      return date.join('-') + ' ' + temp[1]
    },
    toGetTimeRange(startDay, endDay = 1) {
      const end = new Date()
      const start = new Date()
      end.setTime(end.getTime() - 3600 * 1000 * 24 * ~~endDay)
      start.setTime(start.getTime() - 3600 * 1000 * 24 * (~~startDay + 1))

      const formatPicker = (s, r, t = '-') => s.toLocaleDateString().replace(/\//g, t) + (r ? ' 00:00:00' : ' 19:00:59')
      return [
        this.date_fill_zero(formatPicker(new Date(start), true)),
        this.date_fill_zero(formatPicker(end, false))
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
          if (err) throw err

          resolve && resolve('success!')
          this.log_sucs(mTime + filename)
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
      new Promise(resolve => this.add_queue(filelist, parent, resolve))
        .then(data => parent === '' ? this.mainRun.next(data) : this.childRun[parent].next(data))
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
