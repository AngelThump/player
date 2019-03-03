require('!style-loader!css-loader!./css/error.css');
require('!style-loader!css-loader!./css/password-page.css');
import logo from '../dist/assets/small_logo.png';
import VideoPlayer from './player';
import React from 'react';

export default class PasswordProtected extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = {
            showVideoPlayer: false,
            showErrorBanner: false
        };
        this.submit = this.submit.bind(this);
     }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    submit() {
        fetch('https://api.angelthump.com/user/v2/password', {
            method: 'post',
            body: JSON.stringify({
                stream: this.props.channel,
                password: document.getElementById('streampassword').value
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then((response) => {
            return response.json();
        }).then((data) => {
            if(data.success) {
                this.setState({
                    showVideoPlayer: true
                });
            } else {
                this.setState({
                    showErrorBanner: true
                });
            }
        })
    }

    render() {
        let data = this.props.data;
        let channel = this.props.channel;
        let options = this.props.options;
        return (
            <div>
                {this.state.showVideoPlayer ? <VideoPlayer options={options} channel={channel} data={data}/> :
                    <div className='at-password'>
                        <a href='http://angelthump.com'>
                            <img src={logo}/>
                        </a>
                        {this.state.showErrorBanner ? 
                            <div className="error" id="error" style={{display: 'block', textAlign: 'center'}}>
                                Wrong Password!
                            </div> : null
                        }
                        <div className='form' id='form'>
                            <form id='password-form'>
                                <input id='streampassword' type='password' name='password' placeholder='enter the stream password'></input>
                                <button type='button' id='submit' onClick={this.submit}>Submit</button>
                            </form>
                        </div>
                    </div>
                }
            </div>
        )
    }
}