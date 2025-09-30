import React from 'react';

/**
 * RoleSelector shows two cards (User / Practitioner).
 * onChoose('user'|'practitioner') will be called when a card selected.
 */
export default function RoleSelector({ title = 'Choose', onClose, onChoose }) {
  return (
    <div className="modal-backdrop-custom">
      <div className="modal-dialog-centered">
        <div className="modal-card p-3" style={{ maxWidth: 760 }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="m-0">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <div className="card h-100 text-center p-3" style={{ cursor: 'pointer' }} onClick={() => onChoose('user')}>
                <img src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" alt="user" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '50%', margin: '0 auto' }} />
                <h6 className="mt-3">User</h6>
                <p className="text-muted">Sign up as a user/patient to access personalized features.</p>
                <button className="btn btn-outline-primary">Sign up as User</button>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card h-100 text-center p-3" style={{ cursor: 'pointer' }} onClick={() => onChoose('practitioner')}>
                <img src="https://cdn-icons-png.flaticon.com/512/1995/1995574.png" alt="practitioner" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '50%', margin: '0 auto' }} />
                <h6 className="mt-3">Practitioner</h6>
                <p className="text-muted">Sign up as a practitioner to register your clinic and manage appointments.</p>
                <button className="btn btn-primary">Sign up as Practitioner</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
