import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import AuthorAvatar from './author-avatar';
import moment from 'moment';

const styles = theme => ({
  item: {
    paddingLeft: theme.spacing.unit * 2,
    paddingRight: theme.spacing.unit * 2,
    [theme.breakpoints.up('sm')]: {
      paddingLeft: theme.spacing.unit,
      paddingRight: theme.spacing.unit,
    },
    [theme.breakpoints.up('md')]: {
      paddingLeft: theme.spacing.unit * 2,
      paddingRight: theme.spacing.unit * 2,
    },
  },
  highlighted: {
    background: theme.palette.secondary.main,
    color: theme.palette.getContrastText(theme.palette.secondary.main),
  },
  text: {
    paddingRight: 0,
    color: 'inherit',
  },
});

class CompressedTogetherCard extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.getPreviewText = this.getPreviewText.bind(this);
  }

  handleClick() {
    if (this.props.onClick) {
      this.props.onClick();
    }
  }

  getPreviewText(maxLength = 80) {
    const item = this.props.post;
    let text = '';

    if (item.name) {
      text = item.name;
    } else if (item.summary) {
      text = item.summary;
    } else if (item.content) {
      const contentObject = item.content;
      if (contentObject.value) {
        text = contentObject.value;
      } else if (contentObject.html) {
        text = contentObject.html.replace(/<\/?[^>]+(>|$)/g, '');
      }
    }

    if (text.length > maxLength) {
      text = text.substring(0, maxLength);
      text += '…';
    }

    return text;
  }

  render() {
    const { post, highlighted, classes } = this.props;

    // Parse published date
    let date = 'unknown';
    if (post.published) {
      date = moment(post.published).fromNow();
    }

    let readStyle = {};
    if (post._is_read) {
      readStyle.opacity = 0.5;
    }

    return (
      <ListItem
        dense
        button
        onClick={this.handleClick}
        style={readStyle}
        className={
          highlighted
            ? [classes.item, classes.highlighted].join(' ')
            : classes.item
        }
      >
        <AuthorAvatar author={post.author} />
        <ListItemText
          primary={this.getPreviewText()}
          secondary={date}
          className={classes.text}
          classes={{
            primary: classes.text,
            secondary: classes.text,
          }}
        />
      </ListItem>
    );
  }
}

CompressedTogetherCard.defaultProps = {
  post: {},
  highlighted: false,
};

CompressedTogetherCard.propTypes = {
  post: PropTypes.object.isRequired,
  highlighted: PropTypes.bool.isRequired,
};

export default withStyles(styles)(CompressedTogetherCard);
