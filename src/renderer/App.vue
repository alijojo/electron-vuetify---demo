<template>
  <div id="app">
    <v-app>
       <!-- <v-navigation-drawer persistent :mini-variant="miniVariant" :clipped="clipped" v-model="drawer">
        <v-list>
          <v-list-tile router :to="item.to" :key="i" v-for="(item, i) in items" exact>
            <v-list-tile-action>
              <v-icon v-html="item.icon"></v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title v-text="item.title"></v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>
      </v-navigation-drawer>
      <v-toolbar fixed>
        <v-toolbar-side-icon @click.native.stop="drawer = !drawer"></v-toolbar-side-icon>
        <v-btn icon @click.native.stop="miniVariant = !miniVariant">
          <v-icon v-html="miniVariant ? 'chevron_right' : 'chevron_left'"></v-icon>
        </v-btn>
        <v-btn icon @click.native.stop="clipped = !clipped">
          <v-icon>web</v-icon>
        </v-btn>
        <v-btn icon @click.native.stop="fixed = !fixed">
          <v-icon>remove</v-icon>
        </v-btn>
        <v-toolbar-title v-text="title"></v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click.native.stop="rightDrawer = !rightDrawer">
          <v-icon>menu</v-icon>
        </v-btn>
      </v-toolbar> -->
      <main>
        <v-container fluid fill-height>
          <v-slide-y-transition mode="out-in">
            <router-view></router-view>
          </v-slide-y-transition>
        </v-container>
      </main>
      <!-- <v-navigation-drawer temporary :right="right" v-model="rightDrawer">
        <v-list>
          <v-list-tile @click.native="right = !right">
            <v-list-tile-action>
              <v-icon light>compare_arrows</v-icon>
            </v-list-tile-action>
            <v-list-tile-title>Switch drawer (click me)</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-navigation-drawer>
      <v-footer :fixed="fixed">
        <v-spacer></v-spacer>
        <span>&copy; 2017</span>
      </v-footer> -->
    </v-app>
  </div>
</template>

<script>
export default {
  name: 'electron-demo',
  data: () => ({
    clipped: false,
    drawer: true,
    fixed: false,
    items: [
      { icon: 'apps', title: 'Welcome', to: '/' },
      { icon: 'bubble_chart', title: 'Inspire', to: '/inspire' }
    ],
    miniVariant: false,
    right: true,
    rightDrawer: false,
    title: 'Vuetify.js'
  })
}
</script>

<style lang="stylus">
  @import './assets/stylus/main.styl'
</style>


<style>
 @import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons');

/* Global CSS */


/*滚动条美化*/

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track,
::-webkit-scrollbar-thumb {
  border-radius: 999px;
  border: 1px solid transparent;
}

::-webkit-scrollbar-track {
  box-shadow: 0px 0px 100px rgba(0, 0, 0, .2) inset;
}

::-webkit-scrollbar-thumb {
  min-height: 20px;
  background-clip: content-box;
  box-shadow: 0 0 0 5px rgba(0, 0, 0, .2) inset;
}

::-webkit-scrollbar-corner {
  background: transparent;
}
</style>
