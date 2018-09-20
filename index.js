const config = require('./config/database.js')
const parse = require('./src/page-parser.js')
const Backend = require('backend-api')

const MAX_EXISTING_PEN = 5

let page = 1
let existingPenCount = 0
let currentPen = 0
let penPerPage = 0
let pens = []

Backend.init(config.apiKey, config.authDomain, config.databaseName)
  .then(login)
  .then(parsePage)
  .catch((error) => {
    console.log('Init error:', error)
    process.exit(1)
  })

function login () {
  return Backend.signin(config.email, config.password)
}

function logout () {
  return Backend.signout()
}

function parsePage () {
  console.log(`Parsing page ${page}...`)

  parse(page)
    .then(data => {
      pens = data
      penPerPage = data.length - 1
      console.log(`[Success] Parsed page ${page}!`)
      savePen()
    })
    .catch(error => {
      console.log('Parsing error:', error)
      process.exit(1)
    })
}

function savePen () {
  const today = new Date()
  let year = today.getFullYear()

  if (!pens[currentPen]) {
    gotoNextPage()
    return
  }

  pens[currentPen].year = year

  Backend.checkExistence(year, pens[currentPen].url)
    .then(exists => {
      console.log(`Saving pen ${currentPen}/${penPerPage}...`)

      if (exists === true) {
        existingPenCount++
        console.log('Pen already exist. Existing pen count:', existingPenCount)

        if (existingPenCount >= MAX_EXISTING_PEN) {
          endProcess()
        } else {
          gotoNextPen()
        }

        return
      }

      existingPenCount = 0
      Backend.saveContribution(pens[currentPen])
        .then(onPenSaved)
        .catch(error => {
          console.log('Error saving pen:', error)
          process.exit(1)
        })
    })
}

function onPenSaved () {
  if (existingPenCount >= MAX_EXISTING_PEN) {
    endProcess()
    return
  }

  console.log(`[Success] Saved pen - ${pens[currentPen].title}`)

  if (currentPen < penPerPage) {
    gotoNextPen()
  } else {
    gotoNextPage()
  }
}

function gotoNextPen () {
  currentPen++
  savePen()
}

function gotoNextPage () {
  currentPen = 0
  page++
  parsePage()
}

function endProcess () {
  existingPenCount = 0
  logout().then(() => {
    console.log('All new contributions saved')
    process.exit(0)
  })
}
