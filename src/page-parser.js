const phantom = require('phantom')
const getPenDay = require('./utils').getPenDay
const getPenDataFromUrl = require('./utils').getPenDataFromUrl

let phantomInstance
let pageRef
let link
let rejectCb

module.exports = function (page) {
  link = `https://codepen.io/search/pens/?depth=everything&order=newest&page=${page}&q=%23codevember&show_forks=false`

  return new Promise((resolve, reject) => {
    rejectCb = reject

    phantom
      .create()
      .then(createPage)
      .then(openPage)
      .then(getContent)
      .then((content) => {
        onContentLoaded(content, resolve)
      })
      .catch(onError)
  })
}

function createPage (ph) {
  phantomInstance = ph
  return phantomInstance.createPage()
}

function openPage (page) {
  pageRef = page
  return pageRef.open(link)
}

function getContent (status) {
  if (status !== 'success') {
    throw new Error('Failed to open page.')
  }

  return pageRef.property('content')
}

function onContentLoaded (content, resolve) {
  pageRef.evaluate(function () {
    var res = []
    var $items = document.querySelectorAll('.single-pen')

    for (var i = 0, l = $items.length; i < l; i++) {
      res.push({
        url: $items[i].querySelector('.item-title a').getAttribute('href'),
        title: $items[i].querySelector('.item-title a').innerHTML.trim()
      })
    }

    return res
  }).then(function (html) {
    formatData(html)
    pageRef.close()
    phantomInstance.exit()

    resolve(html)
  }).catch(onError)
}

function onError (e) {
  console.log(e)
  pageRef.close()
  phantomInstance.exit()
  if (rejectCb && typeof rejectCb === 'function') rejectCb()
}

function formatData (data) {
  data.forEach((pen) => {
    let {user, image} = getPenDataFromUrl(pen.url)
    pen.author = user
    pen.day = getPenDay(pen.title)
    pen.image = image
    pen.title = pen.title.replace(/(#)?codevember/gi, '').trim()
    pen.url = pen.url.replace('/pen/', '/full/')
  })
}
