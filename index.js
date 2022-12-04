import fs from "fs"
import path from "path"
import WebSocket from "ws"
import chalk from "chalk"

const book = {}
const heading = "\t\t\t\t\t\t\t  B I N A N C E   O R D E R   B O O K   \n"
let symbolHeader = "\t\t\t"
let typeHeader = chalk.green("     Buy\t Quantity\t") + chalk.red("     Sell\t Quantity\t\t")
let v = ""

const p = path.resolve("symbols.txt")
const symbols = fs.readFileSync(p, "utf8").split("\n")

let socketUrl = "wss://stream.binance.com:443/stream?streams="
symbols.forEach((s, i) => {
  socketUrl = socketUrl + `${s.toLowerCase()}@depth/`
  book[s] = {}
  symbolHeader = symbolHeader + s.toUpperCase() + "\t\t\t\t\t\t\t\t\t"
  if (i > 0) {
    typeHeader = typeHeader + typeHeader
  }
})
socketUrl = socketUrl.substring(0, socketUrl.length - 1)

const ws = new WebSocket(socketUrl)

ws.on("open", () => {
  console.log(chalk.green.underline("Binance WebSocket Connected!"))
})

ws.on("message", (raw) => {
  const bufferData = Buffer.from(raw)
  const data = JSON.parse(bufferData.toString())
  
  symbols.forEach(s => {
    if (data?.stream?.includes(s)) {
      book[s] = data.data
    }
  })
  
  v = ""
  let longestPriceLength = 0
  symbols.forEach(s => {
    if (book[s].s) {
      if (book[s].b.length > longestPriceLength) {
        longestPriceLength = book[s].b.length
      }
      if (book[s].a.length > longestPriceLength) {
        longestPriceLength = book[s].a.length
      }
    }
  })
  for (let i = 0; i < 50; i++) {
    for (let j = 0; j < symbols.length; j++) {
      const s = symbols[j]
      if (book[s].s) {
        const buyPrice = book[s].b[i]?.[0] || "\t"
        const buyQuantity = book[s].b[i]?.[1] || "\t"
        const sellPrice = book[s].a[i]?.[0] || "\t"
        const sellQuantity = book[s].a[i]?.[1] || "\t"
        v = v + chalk.green(buyPrice + "\t" + buyQuantity + "\t") + chalk.red(sellPrice + "\t" + sellQuantity + "\t\t")
      }
    }
    v = v + "\n"
  }

  console.clear()
  console.log(chalk.hex("#000000").bgYellowBright(heading))
  console.log(chalk.hex("#000000").bgWhiteBright(symbolHeader))
  console.log(typeHeader)
  console.log(v)
})

ws.on("close", () => {
  console.log(chalk.red.underline("Binance WebSocket Disconnected"))
})

ws.on("error", (error) => {
  console.log(chalk.red("Binance WebSocket Error: ", JSON.stringify(error?.message, null, 2)))
})
