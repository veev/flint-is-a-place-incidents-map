import React from 'react'
import PropTypes from 'prop-types'

const StartInfo = (props) => {
  const { startState, handleTearDown } = props

  const wrapperClasses = ['startInfo-wrapper']

  if (!startState) { 
    wrapperClasses.push('hide')
  }

  return (
    <div 
      className={wrapperClasses.join(' ')}
      >
      <div className='info'>
        <p>In 2016, there were only 98 Flint Police Officers serving a city of 100,000. That is the smallest number of officers of any comparable city in America. Between the high crime, the lack of jobs and the recent water crisis, the FPD is a department in crisis policing a city in crisis. This map documents one week of calls for service in Flint and the challenge the department faces as it tries to meet the demands of a community on the edge.</p>
        <div className='startInfo-enter' onClick={handleTearDown}>
          <span>ENTER</span>
          </div>
      </div>
    </div>
  )
}

StartInfo.propTypes = {
  handleTearDown: PropTypes.func,
  startState: PropTypes.bool.isRequired,
}


export default StartInfo