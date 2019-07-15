import Arweave from 'arweave/web';

const arweave = Arweave.init({
    host: 'arweave.net',// Hostname or IP address for a Arweave node
    port: 80,           // Port, defaults to 1984
    protocol: 'https',  // Network protocol http or https, defaults to http
    timeout: 20000,     // Network request timeouts in milliseconds
    logging: false,     // Enable network request logging
})


const getPostTxList = async() => {
    try{
      const query = {
            op: 'equals',
            expr1: 'App-Name',
            expr2: 'ar-perma-feed'
      }
      const listTxIdPost = await arweave.arql(query);
      return listTxIdPost
    }catch(err){
      console.log(err)
      return []
    }  
}


const getPostTxListByAddress = async(arAddress) => {
    try{
      const query = {
        op: 'and',
        expr1: {
            op: 'equals',
            expr1: 'from',
            expr2: arAddress
        },
        expr2: {
            op: 'equals',
            expr1: 'App-Name',
            expr2: 'ar-perma-feed'
        }     
      }
      const listTxIdPost = await arweave.arql(query);
      return listTxIdPost
    }catch(err){
      console.log(err)
      return []
    }  
  }

const getDataPost = async(txId) => {
        return new Promise(async function(resolve, reject){
            try{
              const tx = await arweave.transactions.get(txId)
              const txData = JSON.parse( tx.get('data', {decode: true, string: true}) )
              const from = await arweave.wallets.ownerToAddress(tx.owner)
              resolve({txId, from:from, txData})
            }catch(err){
              resolve({error:true, err})
            }
        })
}

export {
    arweave,
    getPostTxList,
    getPostTxListByAddress,
    getDataPost
}
