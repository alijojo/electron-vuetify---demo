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
let path = require('path')

const remotePath = '/data/htdocs/ycbb/Insurance/Public/static/packaged-assets/WX_CarLoan/testp'
const localPath = path.resolve('./.load')

export default {
  name: 'index',
  data() {
    return {
      remotePath,
      localPath,
      hostInfo: {
        host: '182.254.240.237',
        port: 22,
        username: 'ubuntu',
        password: 'qrVCeAtkc4keji'
      },
      sftp: null
    }
  },
  mounted() {
    this.download()
  },
  methods: {
    log_sucs: filename => console.log('%c%s', 'color: green', 'Log :: download success!', '文件名:', filename, ',创建时间:', new Date().toLocaleString()),
    f_time: timestamp => new Date(timestamp * 1000).toLocaleString(),
    add_queue(filename, resolve) {
      const remoteFile = this.remotePath + '/' + filename
      const localFile = this.localPath + '/' + filename

      this.sftp.fastGet(remoteFile, localFile, (err, list) => {
        if (err) throw err

        resolve && resolve('success!')
        this.log_sucs(filename)
      })
    },
    download() {
      let Client = new SSH.Client()

      const _this = this
      Client.on('ready', () => {
        console.info('Log :: ready...')

        Client.sftp((err, sftp) => {
          if (err) throw err

          this.sftp = sftp
          this.sftp.readdir(remotePath, (err, list) => {
            if (err) throw err

            list = list.map(v => [v.filename, this.f_time(v.attrs.mtime)])
            function* request() {
              for (let i = 0; i < list.length; ++i) yield req(list[i])
            }

            function req(file) {
              new Promise(resolve => _this.add_queue(file[0], resolve))
                .then(data => run.next(data))
                .catch(err => console.error(err))
            }
            let run = request()
            run.next()
          })
        })
      }).connect(this.hostInfo)
    }
  }
}
</script>

<style lang="stylus" scoped>

</style>


