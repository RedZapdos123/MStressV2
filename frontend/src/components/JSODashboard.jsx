import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../styles/JSODashboard.css'
import '../styles/DashboardCommon.css'
import DataTable from './DataTable'

const JSODashboard = ({ currentUser, onLogout }) => {
  const [battalionInfo, setBattalionInfo] = useState(null)
  const [personnelCount, setPersonnelCount] = useState(0)
  const [stats, setStats] = useState({
    pendingEvaluations: 0,
    completedEvaluations: 0,
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  localStorage.setItem('selectedBattalion', currentUser.battalion._id)

  useEffect(() => {
    fetchBattalionInfo()
    fetchPersonnelData()
  }, [])

  const fetchBattalionInfo = async () => {
    try {
      if (currentUser.battalion) {
        const response = await axios.get(`/api/battalion`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        const battalion = response.data.find(b => b._id === currentUser.battalion)
        setBattalionInfo(battalion)
      }
    } catch (error) {
      console.error('Error fetching battalion info:', error)
    }
  }

  const fetchPersonnelData = async () => {
    try {
      setLoading(true)
      if (currentUser.battalion) {
        const response = await axios.get(`/api/personnel/battalion/${currentUser.battalion._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        const personnel = response.data

        setPersonnelCount(personnel.length)
        
        // Calculate stats.
        const stats = {
          pendingEvaluations: personnel.filter(p => p.peerEvaluation?.status === 'PENDING').length,
          completedEvaluations: personnel.filter(p => p.peerEvaluation?.status === 'EVALUATED').length,
        }
        setStats(stats)
      }
    } catch (error) {
      console.error('Error fetching personnel data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('currentArmyNo')
    
    if (onLogout) {
      onLogout()
    }
    
    navigate('/login')
  }

  const handleViewData = () => {
    navigate('/data-table-jso')
  }

  const showNotification = (message, type) => {
    const notification = document.createElement('div')
    notification.className = `jso-notification ${type}`
    notification.textContent = message
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification)
      }
    }, 3000)
  }

  if (loading) {
    return (
      <div className="jso-dashboard">
        <div className="jso-loading">
          <div className="jso-spinner"></div>
        </div>
      </div>
    )
  }


  return (
    <div className="jso-dashboard">
      /* Header. */
      <header className="jso-dashboard-header">
        <div className="jso-header-content">
          <div className="jso-title-section">
            <div>
              <h1 className="jso-title">SOLDIER SUPPORT SYSTEM</h1>
              <p className="jso-subtitle">JCO Dashboard - {battalionInfo?.name || 'Battalion'}</p>
            </div>
          </div>
          <div className="jso-user-info">
            <div className="jso-user-details">
              <p className="jso-user-name">{currentUser.fullName}</p>
              <p className="jso-user-role">{currentUser.rank} - {currentUser.role}</p>
            </div>
            <button className="jso-logout-btn" onClick={handleLogout}>
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      /* Main Content. */
      <main className="jso-main-content">
        /* Statistics Grid. */
        <section className="jso-stats-grid">
          

          <div className="jso-stat-card">
            <div className="jso-stat-header">
              <span className="jso-stat-title">Pending Evaluations</span>
              <div className="jso-stat-icon">⏳</div>
            </div>
            <h2 className="jso-stat-value">{stats.pendingEvaluations}</h2>
            <p className="jso-stat-description">Awaiting peer evaluation</p>
          </div>

          <div className="jso-stat-card">
            <div className="jso-stat-header">
              <span className="jso-stat-title">Completed Evaluations</span>
              <div className="jso-stat-icon">✅</div>
            </div>
            <h2 className="jso-stat-value">{stats.completedEvaluations}</h2>
            <p className="jso-stat-description">Peer evaluations done</p>
          </div>

          
        </section>

        

        {<DataTable 
          selectedBattalion={currentUser.battalion}
          currentUser={currentUser}
          onLogout={handleLogout}
        />}

      </main>
    </div>
  )
}

export default JSODashboard