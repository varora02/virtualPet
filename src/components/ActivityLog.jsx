import './ActivityLog.css'

function ActivityLog({ activities }) {
  // Show last 20 activities, most recent first
  const recentActivities = [...activities].reverse().slice(0, 20)

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="activity-log">
      <h3 className="activity-title">📋 Activity Log</h3>

      {recentActivities.length === 0 ? (
        <div className="no-activities">
          <span className="no-activity-icon">🌱</span>
          <p>No activities yet. Start caring for your pet!</p>
        </div>
      ) : (
        <div className="activity-list">
          {recentActivities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-content">
                <span className="activity-text">{activity.text}</span>
                <span className="activity-time">{formatTime(activity.timestamp)}</span>
              </div>
              <div className={`activity-user ${activity.user === 'Varun' ? 'varun' : 'gf'}`}>
                {activity.user === 'Varun' ? '💙' : '💖'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ActivityLog
