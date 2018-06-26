import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withRouter } from 'react-router-dom';
import { Shortcuts } from 'react-shortcuts';
import { selectChannel, toggleChannelsMenu, focusComponent } from '../actions';

class GlobalShortcutHandler extends React.Component {
  constructor(props) {
    super(props);
    this.handleShortcuts = this.handleShortcuts.bind(this);
  }

  handleShortcuts(action) {
    console.log('Global shortcut', action);
    const { channels, selectChannel, history, focusComponent } = this.props;
    if (action.indexOf('CHANNEL_') === 0) {
      const channelIndex = parseInt(action.replace('CHANNEL_', '')) - 1;
      if (channels && channels[channelIndex] && channels[channelIndex].uid) {
        // Switch to the selected channel
        const uid = channels[channelIndex].uid;
        history.push(`/channel/${uid}`);
        selectChannel(uid);
        focusComponent('timeline');
      }
    } else {
      switch (action) {
        case 'NEW_POST':
          history.push('/editor');
          break;
        case 'FOCUS_CHANNEL_LIST':
          focusComponent('channels');
          break;
        case 'HELP':
          alert("Sorry, I can't help you yet");
          break;
        case 'KONAMI':
          alert('Look at you. You are very clever');
          break;
      }
    }
  }
  render() {
    return (
      <Shortcuts name="GLOBAL" handler={this.handleShortcuts} global={true}>
        {this.props.children}
      </Shortcuts>
    );
  }
}

const mapStateToProps = state => ({
  channels: state.channels
    .toJS()
    .filter(channel => channel.uid != 'notifications'),
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    { selectChannel, toggleChannelsMenu, focusComponent },
    dispatch,
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withRouter(GlobalShortcutHandler));
