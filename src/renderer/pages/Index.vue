<template>
  <v-layout row wrap justify-center id="wrapper">
    <v-flex xs10 class="mt-4">
      <v-card>
        <v-card-title class="headline">Docs</v-card-title>
        <v-divider></v-divider>
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

const remotePath = '/data/htdocs/ycbb/Insurance/Public/static/packaged-assets/Insurance/img'
const localPath = path.resolve('../../../../load/')

export default {
  name: 'index',
  data() {
    return {
      remotePath,
      localPath: 'D:/TEST-LOAD',
      hostInfo: {
        host: '182.254.240.237',
        port: 22,
        username: 'ubuntu',
        password: 'qrVCeAtkc4keji'
      }
    }
  },
  mounted() {
    var Client = new SSH.Client()

    Client.on('ready', () => {
      console.log('Client :: ready')

      Client.sftp((err, sftp) => {
        if (err) throw err
        sftp.fastGet(this.remotePath, this.localPath, (err, list) => {
          if (err) throw err
          console.dir(list)
        })
      })
    }).connect(this.hostInfo)
  }
}
</script>

<style lang="stylus" scoped>

</style>


