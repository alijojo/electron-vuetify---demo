import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'index',
      component: require('@/pages/index')
    },
    {
      path: '/inspire',
      name: 'inspire',
      component: require('@/components/InspireView')
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
