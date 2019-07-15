import React from 'react';
import './App.css';
import 'carbon-components/scss/globals/scss/styles.scss';
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderMenuItem
} from "carbon-components-react/lib/components/UIShell"
import LoadWallet from './service/LoadWallet'
import { arweave, getPostTxList, getDataPost, getPostTxListByAddress } from './service/arweaveUtils'
import LoadImage from './service/LoadImage';
import Modal from "carbon-components-react/lib/components/Modal"
import Tab from "carbon-components-react/lib/components/Tab"
import Tabs from "carbon-components-react/lib/components/Tabs"
import SearchFeed from './SearchFeed';



const BoxItem = props => {
  const { from, txData, txId} = props.data
  return(
    <div style={{marginLeft:'auto', marginRight:'auto', backgroundColor:'#dfe6e9', marginTop:10, marginBottom:10,padding:10}} class="bx--form-item">
      <p style={{padding:10}}>{txData.text}</p>
      {(txData.image.includes("data:image")) &&
      <div style={{marginLeft:'auto', marginRight:'auto'}} class="bx--text-area__wrapper">
        <img align="center" src={txData.image} id="text-area-3" style={{maxWidth:350, maxHeight:300}} alt="Loaded" />
      </div>
      }     
      <p align="center" style={{padding:5, fontSize:10}}>By:{from}</p> 
    </div>
  )
}

const ShowBox = props => {
  if(props.data.length === 0){
    return(
      <div style={{marginLeft:'auto', marginRight:'auto', backgroundColor:'#dfe6e9', marginTop:10, marginBottom:10,padding:10}} class="bx--form-item">
      <p style={{padding:10}}>Nothing to show</p>
      </div>
    )
  }
  return props.data.map(data => <BoxItem data={data}/>)
}
 

class App extends React.Component{
  state = {
    loading:false,
    loadWallet:false,
    //Wallet Data
    walletAddress:'',
    walletBalance:'',
    walletData:false,
    //Post Data
    textPost:'',
    imagePost:'',
    txModalOpen:false,
    transaction:'',
    fee:'',
    loadingTx:false,
    //Permafeed
    publicPosts:[],
    userPost:[],
    tab:0
  }

  async componentDidMount(){
    try{
      const data = await this.getPosts()
      this.setState({publicPosts:data})
    }catch(err){

    }
  }

  clickLoadWallet = () => {
    const obj = document.getElementById('wallet-handler')
    obj.click()
    return
  }

  loadWallet = async(e) => {
    try{
      this.setState({loading:true})
      const wallet = await LoadWallet(e.target.files[0])
      const walletData = JSON.parse(wallet)
      const walletAddress = await arweave.wallets.jwkToAddress(walletData)
      const walletSatoshi =  await arweave.wallets.getBalance(walletAddress)
      const walletBalance = await arweave.ar.winstonToAr(walletSatoshi)
      const userPost = await this.getPostByAddress(walletAddress)
      this.setState({walletData, userPost,walletAddress, walletBalance, loading:false, loadWallet:true})
    }catch(err){
      console.log(err)
      this.setState({loading:false})
      alert('Error Loading Wallet')
    }
  }

  clickLoadImage = () => {
    const obj = document.getElementById('image-handler')
    obj.click()
    return
  }

  loadImage = async(e) => {
    try{
      this.setState({loading:true, imageLoaded:false, imagePost:''})
      const img = await LoadImage(e.target.files[0])
      console.log(img)
      if(img.includes("data:image")){
        this.setState({loading:false, imagePost:img, imageLoaded:true})
      }else{
        this.setState({loading:false, imageLoaded:false, imagePost:''})
        alert('Please, upload only images')
      }
    }catch(err){
      console.log(err)
      this.setState({loading:false, imageLoaded:false, imagePost:''})
      alert('Error Loading File')
    }
  }

  newPost = async() => {
    try{
      if(!this.state.loadWallet){
        alert('Load your Arweave Wallet')
        return
      }
      this.setState({loading:true})
      const data = JSON.stringify({
        text:this.state.textPost,
        image:this.state.imagePost
      })
      let transaction = await arweave.createTransaction({
          data
      }, this.state.walletData);
      transaction.addTag('App-Name', 'ar-perma-feed');      
      transaction.addTag('perma', 'post');
      const fee = await arweave.ar.winstonToAr(transaction.reward)
      this.setState({transaction, fee, loading:false, txModalOpen:true})
    }catch(err){
      console.log(err)
      this.setState({loading:false, txModalOpen:false})
      return
    }
  }

  getPosts = async() => {
    try{
      const listTx = await getPostTxList()
      let listData = []
      listTx.map(tx => listData.push(getDataPost(tx)))
      const result = await Promise.all(listData)
      return result
    }catch(err){
      console.log(err)
      return []
    }
  }

  getPostByAddress = async(address) => {
    try{
      const listTx = await getPostTxListByAddress(address)
      let listData = []
      listTx.map(tx => listData.push(getDataPost(tx)))
      const result = await Promise.all(listData)
      return result
    }catch(err){
      return []
    }
  }

  confirmNewPost = async() => {
    try{
      const walletSatoshi =  await arweave.wallets.getBalance(this.state.walletAddress)
      if(parseInt(this.state.transaction.reward)>parseInt(walletSatoshi)){
        alert('Insuficient Balance')
        return
      }
      this.setState({loadingTx:true})
      const transaction = this.state.transaction
      await arweave.transactions.sign(transaction, this.state.walletData);
      await arweave.transactions.post(transaction);
      this.setState({loadingTx:false, txModalOpen:false, textPost:'', transaction:'', fee:'', imagePost:''})
      alert('Transaction Send, wait the confirmation to view on the permafeed')
    }catch(err){
      alert('Error')
      this.setState({loadingTx:false})
    }
  }

  closeTxModal = () => this.setState({txModalOpen:false})

  render(){
    return(
      <React.Fragment>
        <div>
        <Header aria-label="">
          <HeaderName href="#" prefix="AR">
            [PermaFeed]
          </HeaderName>
          <HeaderGlobalBar>
              {this.state.loadWallet ?
                null
               :                
                <HeaderMenuItem onClick={() => this.clickLoadWallet()}>
                  <p>Load Wallet</p>
                  <input type="file" onChange={ e => this.loadWallet(e)} id="wallet-handler" style={{display: "none"}}/>
                </HeaderMenuItem>
              }
          </HeaderGlobalBar>
        </Header>
        </div>
        {this.state.walletData && 
          <React.Fragment>
            <p align="center" style={{marginTop:50}}>{this.state.walletAddress}</p>
            <p align="center">{this.state.walletBalance} AR</p>
          </React.Fragment>
        }
        <div style={{display: 'flex' , flexDirection:"column",justifyContent: 'space-between', paddingTop:70}}>
          <div style={{marginLeft:'auto', marginRight:'auto'}} class="bx--form-item">
            <label for="text-area-2" class="bx--label">Your Message</label>
            <div class="bx--text-area__wrapper">
              <textarea value={this.state.textPost} onChange={(e) => this.setState({textPost:e.target.value})} id="text-area-2" class="bx--text-area" rows="4" cols="50" placeholder="Your Message" ></textarea>
            </div>
          </div>
          {this.state.imagePost &&
          <div style={{marginLeft:'auto', marginRight:'auto'}} class="bx--form-item">
            <label for="text-area-3" class="bx--label">Loaded Image</label>
            <div class="bx--text-area__wrapper">
              <img src={this.state.imagePost} id="text-area-3" style={{maxWidth:350, maxHeight:300}} alt="Loaded" />
            </div>
          </div>
          }
          
          <div style={{marginLeft:'auto', marginRight:'auto'}} class="bx--form-item">
          
          <button class="bx--btn bx--btn--secondary" onClick={this.clickLoadImage} type="button">Load Image</button>   
            <input type="file" accept="image/*" onChange={ e => this.loadImage(e)} id="image-handler" style={{display: "none"}}/>
          </div>
          <div style={{marginLeft:'auto', marginRight:'auto'}} class="bx--form-item">
            <button onClick={this.newPost} class="bx--btn bx--btn--primary" type="button">Submit Post</button>
          </div>

           
            <div style={{paddingTop:40, marginLeft:'auto', marginRight:'auto'}} className="bx--grid bx--grid--full-width">
            <Tabs selected={this.state.tab}>
              <Tab label="PermaFeed" onClick={()=>this.setState({tab:0})}/>
              <Tab label="My Feed" onClick={()=>this.setState({tab:1})}/>
              <Tab label="Search Feed" onClick={()=>this.setState({tab:2})}/>
            </Tabs>
            {(this.state.tab===0) && <ShowBox data={this.state.publicPosts}/>}
            {(this.state.tab===1) && <ShowBox data={this.state.userPost}/>}
            {(this.state.tab===2) && <SearchFeed/> }
          </div>
        </div>
        <Modal open={this.state.txModalOpen}
          modalHeading={"New Post"}
          primaryButtonText={"Confirm"}
          secondaryButtonText={"Cancel"}
          onRequestSubmit={this.confirmNewPost}
          onSecondarySubmit={this.closeTxModal}

        >
          <div style={{display: 'flex' , flexDirection:"column",justifyContent: 'space-between'}}>
          <div style={{marginLeft:'auto', marginRight:'auto'}}>
            <label for="fee-confirm" class="bx--label">Transaction Fee</label>
            <p id="fee-confirm">{this.state.fee} AR</p>

            <label for="txt-confirm" class="bx--label">Text</label>
            <p id="txt-confirm">{this.state.textPost}</p>

            {this.state.imagePost &&
              <div style={{marginLeft:'auto', marginRight:'auto'}} class="bx--form-item">
                <label for="img-confirm" class="bx--label">Loaded Image</label>
                <div class="bx--text-area__wrapper">
                  <img src={this.state.imagePost} id="img-confirm" style={{maxWidth:350, maxHeight:300}} alt="Loaded" />
                </div>
              </div>
            }
             {this.state.loadingTx &&
                <div class="bx--loading-overlay">
                  <div data-loading class="bx--loading">
                    <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
                      <title>Loading</title>              
                      <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5" />
                    </svg>
                  </div>
                </div>
              }
          </div>
          </div>
        </Modal>
        {this.state.loading &&
        <div class="bx--loading-overlay">
          <div data-loading class="bx--loading">
            <svg class="bx--loading__svg" viewBox="-75 -75 150 150">
              <title>Loading</title>              
              <circle class="bx--loading__stroke" cx="0" cy="0" r="37.5" />
            </svg>
          </div>
        </div>
      }
      </React.Fragment>

    )
  }
}

export default App;
