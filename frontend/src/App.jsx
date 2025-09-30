
import React, { useEffect, useState } from 'react'
import Home from './Home'
import SignUp from './components/SignUp'
import SignIn from './components/SignIn'
import PractitionerSignUp from './components/PractitionerSignUp'
import RoleSelector from './components/RoleSelector'
import LocationConsent from './components/LocationConsent'
import UserDashBoard from './components/UserDashBoard'
import PractitionerDashboard from './components/PractitionerDashboard'

export default function App() {
  // Modal orchestration state
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const [roleAction, setRoleAction] = useState(null) // 'signup' | 'signin'
  const [chosenRoleForAction, setChosenRoleForAction] = useState(null) // 'user' | 'practitioner'
  const [awaiting, setAwaiting] = useState(null) // 'signup' | 'signin' | null
  const [location, setLocation] = useState(null)
  const [showSignUpUser, setShowSignUpUser] = useState(false)
  const [showSignUpPract, setShowSignUpPract] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [signinRole, setSigninRole] = useState('user')
  const [user, setUser] = useState(null)
  const [practitioner, setPractitioner] = useState(null)

  useEffect(() => {
    const rawUser = localStorage.getItem('user')
    if (rawUser) setUser(JSON.parse(rawUser))
    const rawP = localStorage.getItem('practitioner')
    if (rawP) setPractitioner(JSON.parse(rawP))
  }, [])

  // Open role selector for signup
  function handleOpenSignup() {
    setShowRoleSelector(true)
    setRoleAction('signup')
  }
  // Open role selector for signin
  function handleOpenSignin() {
    setShowRoleSelector(true)
    setRoleAction('signin')
  }

  // Render header with sign in/up buttons
  // You can move this to a Header component if desired
  return (
    <div>
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, padding: 16 }}>
        {!user && !practitioner ? (
          <>
            <button className="btn btn-outline-primary me-2" onClick={handleOpenSignin}>Sign in</button>
            <button className="btn btn-primary" onClick={handleOpenSignup}>Sign up</button>
          </>
        ) : (
          <>
            {user && <span className="me-2">Hi, {user.name}</span>}
            {practitioner && <span className="me-2">Hi, {practitioner.name}</span>}
            <button className="btn btn-outline-secondary" onClick={() => { localStorage.clear(); setUser(null); setPractitioner(null); }}>Log out</button>
          </>
        )}
      </div>
      {user ? <UserDashBoard user={user} /> : practitioner ? <PractitionerDashboard practitioner={practitioner} /> : <Home />}
      {/* Role selector modal */}
      {showRoleSelector && (
        <RoleSelector
          title={roleAction === 'signup' ? 'Sign up as' : 'Sign in as'}
          onClose={() => setShowRoleSelector(false)}
          onChoose={(role) => {
            setShowRoleSelector(false)
            setChosenRoleForAction(role)
            setAwaiting(roleAction)
          }}
        />
      )}
      {/* Location consent modal */}
      {awaiting && (
        <LocationConsent
          title={awaiting === 'signup' ? 'Allow location to continue for Sign up' : 'Allow location to continue for Sign in'}
          onAllow={(loc) => {
            setLocation(loc)
            setAwaiting(null)
            if (roleAction === 'signup') {
              if (chosenRoleForAction === 'user') setShowSignUpUser(true)
              else setShowSignUpPract(true)
            } else {
              setSigninRole(chosenRoleForAction)
              setShowSignIn(true)
            }
          }}
          onCancel={() => setAwaiting(null)}
        />
      )}
      {/* User sign up modal */}
      {showSignUpUser && <SignUp onClose={() => setShowSignUpUser(false)} onAuth={u => setUser(u)} location={location} />}
      {/* Practitioner sign up modal */}
      {showSignUpPract && <PractitionerSignUp onClose={() => setShowSignUpPract(false)} onAuth={p => setPractitioner(p)} initialLocation={location} />}
      {/* Sign in modal (user or practitioner) */}
      {showSignIn && <SignIn role={signinRole} onClose={() => setShowSignIn(false)} onAuth={x => signinRole === 'user' ? setUser(x) : setPractitioner(x)} location={location} />}
    </div>
  )
}
