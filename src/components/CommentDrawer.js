import React from 'react'
import moment from 'moment'
import { PropTypes } from 'prop-types'

const formatFacebookTime = (date) => {
  return moment(date).format("MMM Do YYYY") + " at " + moment(date).format("h:mma")
}

const insertComments = (comments) => {
  return comments.map( (comment, i) => {
    return (
      <div className="whyDoWeNeedThisDiv" key={`why${i}`}>
      <div className="postComment" key={`${comment.id}-${i}`}><p>{comment.message}</p></div>
      {(comment.replies) ?
      <ul className="commentReplyWrapper">{insertReplies(comment.replies.data)}</ul> :
      null }
      </div>
    )
  })
}

const insertReplies = (replies) => {
  return (
    <ul>
      {replies.map( (reply, i) => {
        return <li className="commentReply" key={`${reply.id}-${i}`}><p>{reply.message}</p></li>
      })
    }
    </ul>
  )
}

const CommentDrawer = (props) => {
  const isOpen = props.isCommentDrawerOpen

  const insertPost = () => {
    const post = props.postData;
    if (Object.keys(post).length === 0) {
      return null;
    } else {
      return (
        <div className="post-wrapper">
          <div className="post">
            <div className="post-info">
              <div className="avatar"></div>
              <div className="metadata">
                <div className="account">Flint Police Operations</div>
                <div className="time">{formatFacebookTime(post.created_time)}</div>
              </div>
            </div>
            <div className="post-body"><p>{post.message}</p></div>
            {post.comments ? 
              <div className="postCommentWrapper">{insertComments(post.comments.data)}</div> : 
              null }
          </div>
        </div>
      )
    }
  }  

  return (
    <div 
      className={`boardComments${isOpen ? ' open' : ''}`}>
      <div className="bogus-padding">{insertPost()}</div>
    </div>
  )
}

CommentDrawer.propTypes = {
  isCommentDrawerOpen: PropTypes.bool,
  postData: PropTypes.object,
  currentKey: PropTypes.string,
  updateAudioIndex: PropTypes.func,
}

export default CommentDrawer