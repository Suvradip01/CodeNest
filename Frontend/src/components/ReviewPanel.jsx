import React from 'react'
import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

export default function ReviewPanel({ review }) {
  return (
    <div className="panel">
      <div className="panelHeader">Code Review</div>
      <div className="panelBody">
        <div className="reviewContent">
          <Markdown rehypePlugins={[rehypeHighlight]}>{review}</Markdown>
        </div>
      </div>
    </div>
  )
}

