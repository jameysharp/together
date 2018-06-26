import React from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { Shortcuts } from 'react-shortcuts';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import ReactList from 'react-list';
import CompressedPost from './compressed-post';
import TogetherCard from './card/index';
import { decrementChannelUnread, updatePost, focusComponent } from '../actions';
import { posts as postsService } from '../modules/feathers-services';
import getChannelSetting from '../modules/get-channel-setting';

const styles = theme => ({
  wrapper: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  previewColumn: {
    width: '100%',
    overflow: 'auto',
    borderRight: '1px solid ' + theme.palette.divider,
    flexShrink: 0,
    [theme.breakpoints.up('sm')]: {
      width: 250,
    },
    [theme.breakpoints.up('md')]: {
      width: 300,
    },
    [theme.breakpoints.up('lg')]: {
      width: 400,
    },
  },
  postColumn: {
    flexGrow: 1,
    // overflow: 'auto',
    position: 'absolute',
    width: '100%',
    height: '100%',
    // iOS hack thing
    overflowY: 'scroll',
    '-webkit-overflow-scrolling': 'touch',
    [theme.breakpoints.up('sm')]: {
      position: 'relative',
    },
  },
  loadMore: {
    width: '100%',
  },
  closePost: {
    display: 'block',
    position: 'fixed',
    top: 60,
    right: 10,
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
});

class ClassicView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      post: null,
    };
    this.elRef = React.createRef();
    this.postRef = React.createRef();
    this.handleScroll = this.handleScroll.bind(this);
    this.handleShortcuts = this.handleShortcuts.bind(this);
    this.handlePostShortcuts = this.handlePostShortcuts.bind(this);
    this.handlePostSelect = this.handlePostSelect.bind(this);
    this.renderItem = this.renderItem.bind(this);
    this.renderLoadMore = this.renderLoadMore.bind(this);
  }

  componentDidMount() {
    if (this.props.focussed && this.elRef.current) {
      this.elRef.current._domNode.focus();
    }
  }

  componentWillReceiveProps(newProps) {
    if (newProps.focussed && !this.props.focussed && this.elRef.current) {
      console.log('Focussing classic list');
      this.elRef.current._domNode.focus();
    }
    if (
      newProps.postFocussed &&
      !this.props.postFocussed &&
      this.postRef.current
    ) {
      this.postRef.current._domNode.focus();
      console.log('focussing classic post');
    }
  }

  handlePostShortcuts(action, event) {
    console.log('post shortcut', action);
    const scrollDistance = 30;
    if (this.props.postFocussed) {
      const post = this.props.posts.find(p => p._id == this.state.post);
      switch (action) {
        case 'SCROLL_UP':
          this.postRef.current._domNode.scrollBy(0, 0 - scrollDistance);
          break;
        case 'SCROLL_DOWN':
          this.postRef.current._domNode.scrollBy(0, scrollDistance);
          break;
        case 'TO_TIMELINE': {
          this.props.focusComponent('timeline');
          break;
        }
        case 'OPEN': {
          if (post && post.url) {
            window.open(post.url, '_blank');
          }
          break;
        }
        case 'NEXT': {
          if (post) {
            const index = this.props.posts.findIndex(p => p._id == post._id);
            if (index < this.props.posts.length - 1) {
              this.handlePostSelect(this.props.posts[index + 1]);
            }
          }
          break;
        }
        case 'TOGGLE_READ': {
          if (post._is_read === false) {
            postsService
              .update(post._id, {
                channel: this.props.selectedChannel,
                method: 'mark_read',
              })
              .then(res => {
                this.props.updatePost(post._id, '_is_read', true);
                this.props.decrementChannelUnread(this.props.selectedChannel);
              })
              .catch(err => {
                console.log('Error marking post read', err);
              });
          } else if (post._is_read === true) {
            postsService
              .update(post._id, {
                channel: this.props.selectedChannel,
                method: 'mark_unread',
              })
              .then(res => {
                this.props.updatePost(post._id, '_is_read', false);
                this.props.incrementChannelUnread(this.props.selectedChannel);
              })
              .catch(err => {
                console.log('Error marking post read', err);
              });
          }
          break;
        }
      }
    }
  }

  handleShortcuts(action, event) {
    if (this.props.focussed) {
      console.log('classic list shortcut', action);
      const post = this.props.posts.find(p => p._id == this.state.post);

      switch (action) {
        case 'NEXT':
          if (!this.state.post) {
            this.setState({ post: this.props.posts[0]._id });
          } else {
            const index = this.props.posts.findIndex(
              p => p._id == this.state.post,
            );
            if (index < this.props.posts.length - 1) {
              this.handlePostSelect(this.props.posts[index + 1]);
              if (this.infiniteScroll) {
                this.infiniteScroll.scrollAround(index + 1);
              }
            }
          }
          break;
        case 'PREVIOUS':
          if (!this.state.post) {
            this.setState({ post: this.props.posts[0]._id });
          } else {
            const index = this.props.posts.findIndex(
              p => p._id == this.state.post,
            );
            if (index > 0) {
              this.handlePostSelect(this.props.posts[index - 1]);
              if (this.infiniteScroll) {
                this.infiniteScroll.scrollAround(index - 1);
              }
            }
          }
          break;
        case 'GO_TO_CHANNEL_LIST':
          console.log('Go to channel list');
          this.props.focusComponent('channels');
          break;
        case 'SELECT_POST':
          console.log('Move controls to post');
          this.props.focusComponent('post');
          break;
        case 'OPEN':
          if (post && post.url) {
            window.open(post.url, '_blank');
          }
          break;
        case 'TOGGLE_READ': {
          if (post._is_read === false) {
            postsService
              .update(post._id, {
                channel: this.props.selectedChannel,
                method: 'mark_read',
              })
              .then(res => {
                this.props.updatePost(post._id, '_is_read', true);
                this.props.decrementChannelUnread(this.props.selectedChannel);
              })
              .catch(err => {
                console.log('Error marking post read', err);
              });
          } else if (post._is_read === true) {
            postsService
              .update(post._id, {
                channel: this.props.selectedChannel,
                method: 'mark_unread',
              })
              .then(res => {
                this.props.updatePost(post._id, '_is_read', false);
                this.props.incrementChannelUnread(this.props.selectedChannel);
              })
              .catch(err => {
                console.log('Error marking post read', err);
              });
          }
          break;
        }
      }
    }
  }

  handleScroll() {
    const infiniteScrollEnabled = getChannelSetting(
      this.props.selectedChannel,
      'infiniteScroll',
      this.props.channelSettings,
    );
    if (infiniteScrollEnabled) {
      const [
        firstVisibleIndex,
        lastVisibleIndex,
      ] = this.infiniteScroll.getVisibleRange();
      if (lastVisibleIndex >= this.props.posts.length - 1) {
        this.props.loadMore();
      }
    }
  }

  handlePostSelect(post) {
    const read = post._is_read;
    post._is_read = true;
    this.setState({ post: post._id });
    // Mark the post as read
    if (!read) {
      postsService
        .update(post._id, {
          channel: this.props.selectedChannel,
          method: 'mark_read',
        })
        .then(res => {
          this.props.updatePost(post._id, '_is_read', true);
          this.props.decrementChannelUnread(this.props.selectedChannel);
        })
        .catch(err => {
          console.log('Error marking post read', err);
        });
    }
  }

  renderItem(index, key) {
    const post = this.props.posts[index];
    return (
      <CompressedPost
        key={key}
        post={post}
        onClick={() => {
          this.handlePostSelect(post);
          this.props.focusComponent('post');
        }}
        highlighted={
          this.state.post && this.state.post === post._id ? true : false
        }
      />
    );
  }

  renderLoadMore() {
    const infiniteScrollEnabled = getChannelSetting(
      this.props.selectedChannel,
      'infiniteScroll',
      this.props.channelSettings,
    );

    if (infiniteScrollEnabled) {
      return null;
    }
    if (this.props.loadMore) {
      return (
        <Button
          className={this.props.classes.loadMore}
          onClick={this.props.loadMore}
        >
          Load More
        </Button>
      );
    }
    return null;
  }

  render() {
    return (
      <Shortcuts
        ref={this.elRef}
        name="TIMELINE"
        handler={this.handleShortcuts}
      >
        <div className={this.props.classes.wrapper}>
          <List
            className={this.props.classes.previewColumn}
            onScroll={this.handleScroll}
          >
            <ReactList
              itemRenderer={this.renderItem}
              length={this.props.posts.length}
              type="variable"
              ref={el => {
                this.infiniteScroll = el;
              }}
            />
            {this.renderLoadMore()}
          </List>
          {this.state.post && (
            <Shortcuts
              ref={this.postRef}
              name="POST"
              handler={this.handlePostShortcuts}
              className={this.props.classes.postColumn}
              // stopPropagation={true}
              // preventDefault={true}
            >
              <TogetherCard
                post={this.props.posts.find(
                  post => post._id == this.state.post,
                )}
                style={{
                  margin: 0,
                  minHeight: '100%',
                  maxWidth: 700,
                  boxShadow: 'none',
                }}
              />
              <IconButton
                aria-label="Close Post"
                className={this.props.classes.closePost}
                onClick={() => this.setState({ post: null })}
              >
                <CloseIcon />
              </IconButton>
            </Shortcuts>
          )}
        </div>
      </Shortcuts>
    );
  }
}

ClassicView.defaultProps = {
  posts: [],
};

ClassicView.propTypes = {
  posts: PropTypes.array.isRequired,
};

function mapStateToProps(state, props) {
  return {
    selectedChannel: state.app.get('selectedChannel'),
    channelSettings: state.settings.get('channels'),
    focussed: state.app.get('focussedComponent') == 'timeline',
    postFocussed: state.app.get('focussedComponent') == 'post',
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      decrementChannelUnread: decrementChannelUnread,
      updatePost: updatePost,
      focusComponent,
    },
    dispatch,
  );
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withStyles(styles)(ClassicView));
