const URL = 'https://codepen.io'
const BASE_REGEX = /http(s)?:\/\/(www\.)?codepen\.io\//

module.exports.getPenDataFromUrl = function getPenDataFromUrl (url) {
  let params = url.replace(BASE_REGEX, '').split('/')
  let user = params[0]
  let id = params[2]
  id = id.split('?')[0] // Remove query params
  let image = `${URL}/${user}/pen/${id}/image/small.png`

  return {
    user,
    id,
    image
  }
}

module.exports.isCodepenUrl = function isCodepenUrl (url) {
  return BASE_REGEX.test(url)
}

module.exports.getPenDay = function getPenDay (title) {
  const today = new Date()
  let day = title.replace(today.getFullYear(), '').replace(/\D/gi, '')
  if (day !== '') {
    day = parseInt(day, 10)
  } else {
    day = today.getDate()
  }

  return day
}
