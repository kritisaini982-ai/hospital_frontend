import React, { useEffect, useState } from 'react';
const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function Form({ title, onSubmit, children }) {
  return <div className="card form"><h2>{title}</h2><form onSubmit={onSubmit}>{children}</form></div>;
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('hu') || 'null'));
  const [page, setPage] = useState('home');
  const [doctors, setDoctors] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`${API}/doctors`).then(r => r.json()).then(setDoctors).catch(() => {});
  }, []);

  const logout = () => { localStorage.removeItem('hu'); setUser(null); setPage('home'); };
  const go = p => { setMsg(''); setPage(p); };

  return <>
    <nav>
      <b onClick={() => go('home')}>🏥 Multi-Speciality Hospital</b>
      <span onClick={() => go('doctors')}>Doctors</span>
      {user?.role !== 'doctor' && user?.role !== 'admin' && <span onClick={() => go('appointment')}>Appointment</span>}
      {user ? <>
        {user.role === 'doctor' ? (
          <span onClick={() => go('doctor-dashboard')}>Doctor Portal</span>
        ) : user.role === 'admin' ? (
          <span onClick={() => go('admin')}>Admin Dashboard</span>
        ) : (
          <span onClick={() => go('dashboard')}>Dashboard</span>
        )}
        <span onClick={logout}>Logout</span>
      </> : <><span onClick={() => go('login')}>Login</span><span onClick={() => go('register')}>Register</span></>}
    </nav>
    <main>
      {msg && <div className="notice">{msg}</div>}
      {page === 'home' && <Home setPage={go}/>} 
      {page === 'login' && <Login setUser={setUser} setPage={go} setMsg={setMsg}/>} 
      {page === 'register' && <Register setPage={go} setMsg={setMsg}/>} 
      {page === 'dashboard' && user && user.role === 'patient' && <Dashboard user={user} doctors={doctors}/>} 
      {page === 'doctor-dashboard' && user && user.role === 'doctor' && <DoctorDashboard user={user} doctors={doctors} setMsg={setMsg}/>} 
      {page === 'doctors' && <Doctors doctors={doctors}/>} 
      {page === 'appointment' && <Appointment user={user} doctors={doctors} setMsg={setMsg}/>} 
      {page === 'admin' && user && user.role === 'admin' && <Admin user={user} setMsg={setMsg}/>} 
    </main>
  </>;
}

const Home = ({setPage}) => <>
  <section className="hero"><h1>Multi-Speciality Hospital</h1><p>Specialist doctors • Patient care • Secure academic lab</p><button onClick={() => setPage('appointment')}>Book Appointment</button></section>
  <div className="grid">{['Cardiology','Neurology','Orthopedics','Dermatology','Pediatrics','General Medicine'].map(x => <div className="card" key={x}><h3>{x}</h3><p>Specialist hospital services.</p></div>)}</div>
  <div className="card"><h2>NS-P07 Security Assessment</h2><p>Local educational lab for authentication, access control, input handling, and security configuration.</p></div>
</>;

function Login({setUser, setPage, setMsg}) {
  const [e, setE] = useState('patient@hospital.local');
  const [p, setP] = useState('Patient@123');

  async function submit(x) { 
    x.preventDefault(); 
    setMsg(''); 
    try { 
      const r = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, password: p })
      }); 
      const d = await r.json(); 
      if(!r.ok) throw Error(d.message || 'Login failed'); 
      localStorage.setItem('hu', JSON.stringify(d)); 
      setUser(d); 
      if (d.role === 'doctor') {
        setPage('doctor-dashboard');
      } else if (d.role === 'admin') {
        setPage('admin');
      } else {
        setPage('dashboard'); 
      }
    } catch(err) { 
      setMsg(err.message); 
    } 
  }

  return (
    <Form title="Hospital Login" onSubmit={submit}>
      <input value={e} onChange={x => setE(x.target.value)} placeholder="Email" required />
      <input type="password" value={p} onChange={x => setP(x.target.value)} placeholder="Password" required />
      <button>Login</button>
      <small>
        Patient demo: patient@hospital.local / Patient@123<br/>
        Doctor demo: doctor@hospital.local / Doctor@123<br/>
        Admin demo: admin@hospital.local / Admin@123
      </small>
    </Form>
  );
}

function Register({setPage,setMsg}) {
  const [n,setN]=useState(''),[e,setE]=useState(''),[p,setP]=useState('');
  async function submit(x) { x.preventDefault(); try { const r=await fetch(`${API}/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n,email:e,password:p})}); const d=await r.json(); if(!r.ok) throw Error(d.message||'Registration failed'); setMsg(d.message); setPage('login'); } catch(err) { setMsg(err.message); } }
  return <Form title="Patient Registration" onSubmit={submit}><input value={n} onChange={x=>setN(x.target.value)} placeholder="Name" required/><input value={e} onChange={x=>setE(x.target.value)} placeholder="Email" type="email" required/><input value={p} onChange={x=>setP(x.target.value)} placeholder="Password (8+)" type="password" required/><button>Register</button></Form>;
}

function Doctors({doctors}) { const [q,setQ]=useState(''); const a=doctors.filter(d=>(d.name+d.specialization).toLowerCase().includes(q.toLowerCase())); return <div className="card"><h2>Doctors</h2><input value={q} onChange={x=>setQ(x.target.value)} placeholder="Search doctor or specialization"/><div className="grid">{a.map(d=><div className="doctor" key={d.id}><h3>{d.name}</h3><p>{d.specialization}</p></div>)}</div></div>; }

function Appointment({user, doctors, setMsg}) { 
  const [d, setD] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState(''); 

  async function submit(x) {
    x.preventDefault();
    if(!user) { setMsg('Please login first.'); return; }
    if(!d) { setMsg('Please select a doctor.'); return; }
    try {
      const r = await fetch(`${API}/appointments`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({patientId: user.id, doctorId: Number(d), appointmentDate: date, reason})
      });
      if(!r.ok) throw Error('Could not book appointment');
      setMsg('Appointment booked successfully.');
    } catch(err) {
      setMsg(err.message);
    }
  } 

  return (
    <Form title="Book Appointment" onSubmit={submit}>
      <select value={d} onChange={x => setD(x.target.value)} required>
        <option value="" disabled>Select a doctor...</option>
        {doctors.map(x => <option key={x.id} value={x.id}>{x.name} - {x.specialization}</option>)}
      </select>
      <input type="date" value={date} onChange={x => setDate(x.target.value)} required/>
      <textarea value={reason} onChange={x => setReason(x.target.value)} placeholder="Reason"></textarea>
      <button>Book Appointment</button>
    </Form>
  ); 
}

function Dashboard({user, doctors}) {
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  
  const currentUserId = user?.id || user?.userId;

  const fetchData = () => {
    if (!currentUserId) return;

    // Fetch Appointments
    fetch(`${API}/appointments`)
      .then(r => r.json())
      .then(data => {
        setAppointments(data.filter(app => (app.patientId || app.patient?.id) === currentUserId));
      })
      .catch(() => {});

    // Fetch Prescriptions
    fetch(`${API}/prescriptions`)
      .then(r => r.json())
      .then(data => {
        setPrescriptions(data.filter(p => Number(p.patientId) === Number(currentUserId)));
      })
      .catch(() => {});

    // Fetch Billings
    fetch(`${API}/billings`)
      .then(r => r.json())
      .then(data => {
        setBills(data.filter(b => Number(b.patientId) === Number(currentUserId)));
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const cancelAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      const r = await fetch(`${API}/appointments/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error("Failed to delete appointment");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const payBill = async (id) => {
    try {
      const r = await fetch(`${API}/billings/${id}/pay`, { method: 'PUT' });
      if (!r.ok) throw new Error("Failed to process payment");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card">
      <h2>Welcome, {user.name}</h2>
      <p>Role: <b>{user.role}</b></p>
      <p>Email: {user.email}</p>
      
      <h3 style={{marginTop: '20px'}}>My Appointments</h3>
      {appointments.length === 0 ? <p>No appointments booked yet.</p> : (
        <table>
          <thead><tr><th>Date</th><th>Doctor</th><th>Reason</th><th>Action</th></tr></thead>
          <tbody>
            {appointments.map(app => {
              const doc = doctors?.find(d => d.id === app.doctorId);
              const doctorDisplay = app.doctor?.name || (doc ? `${doc.name} (${doc.specialization})` : `Doctor ID: ${app.doctorId}`);
              return (
                <tr key={app.id}>
                  <td>{app.appointmentDate}</td>
                  <td>{doctorDisplay}</td>
                  <td>{app.reason || 'N/A'}</td>
                  <td><button onClick={() => cancelAppointment(app.id)} style={{background: '#d9534f', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'}}>Cancel</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h3 style={{marginTop: '25px'}}>My Prescriptions</h3>
      {prescriptions.length === 0 ? <p>No prescriptions issued yet.</p> : (
        <table>
          <thead><tr><th>ID</th><th>Medications</th><th>Instructions</th></tr></thead>
          <tbody>
            {prescriptions.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.medications}</td>
                <td>{p.instructions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{marginTop: '25px'}}>Billing Information</h3>
      {bills.length === 0 ? <p>No bills found.</p> : (
        <table>
          <thead><tr><th>Description</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {bills.map(b => (
              <tr key={b.id}>
                <td>{b.description}</td>
                <td>${b.amount}</td>
                <td><b>{b.status}</b></td>
                <td>
                  {b.status === 'Pending' && (
                    <button 
                      onClick={() => payBill(b.id)} 
                      style={{background: '#16a34a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'}}
                    >
                      Pay Now
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function DoctorDashboard({ user, doctors, setMsg }) {
  const [appointments, setAppointments] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [medications, setMedications] = useState('');
  const [instructions, setInstructions] = useState('');

  const docRecord = doctors.find(d => d.email === user.email || d.name?.toLowerCase() === user.name?.toLowerCase());

  useEffect(() => {
    if (!docRecord) return;
    fetch(`${API}/appointments`)
      .then(r => r.json())
      .then(data => {
        const filtered = data.filter(app => Number(app.doctorId || app.doctor?.id) === Number(docRecord.id));
        setAppointments(filtered);
      })
      .catch(() => {});
  }, [user, doctors]);

  const submitPrescription = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${API}/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: Number(appointmentId),
          patientId: Number(patientId),
          doctorId: Number(docRecord?.id),
          medications,
          instructions
        })
      });
      if (!r.ok) throw new Error('Failed to issue prescription');
      setMsg('Prescription issued successfully.');
      setMedications('');
      setInstructions('');
      setPatientId('');
      setAppointmentId('');
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="card">
      <h2>Doctor Portal: {user.name}</h2>
      <p>Role: <b>{user.role}</b> | Specialization: {docRecord?.specialization}</p>
      
      <h3 style={{marginTop: '20px'}}>Scheduled Appointments</h3>
      {appointments.length === 0 ? <p>No appointments scheduled.</p> : (
        <table>
          <thead><tr><th>Date</th><th>Appt ID</th><th>Patient ID</th><th>Reason</th></tr></thead>
          <tbody>
            {appointments.map(app => (
              <tr key={app.id}>
                <td>{app.appointmentDate}</td>
                <td>{app.id}</td>
                <td>{app.patientId}</td>
                <td>{app.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 style={{marginTop: '25px'}}>Issue Prescription</h3>
      <form onSubmit={submitPrescription} className="form" style={{boxShadow: 'none', padding: 0}}>
        <input placeholder="Appointment ID" value={appointmentId} onChange={e => setAppointmentId(e.target.value)} required />
        <input placeholder="Patient ID" value={patientId} onChange={e => setPatientId(e.target.value)} required />
        <textarea placeholder="Medications..." value={medications} onChange={e => setMedications(e.target.value)} required />
        <textarea placeholder="Instructions..." value={instructions} onChange={e => setInstructions(e.target.value)} required />
        <button>Submit Prescription</button>
      </form>
    </div>
  );
}

function Admin({user, setMsg}) { 
  const [patients, setPatients] = useState([]); 
  const [bills, setBills] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const fetchAdminData = () => {
    fetch(`${API}/admin/patients`).then(r => r.json()).then(setPatients).catch(() => {});
    fetch(`${API}/billings`).then(r => r.json()).then(setBills).catch(() => {});
  };

  useEffect(() => {
    if(user?.role === 'admin') {
      fetchAdminData();
    }
  }, [user]); 

  const handleCreateBill = async (e) => {
    e.preventDefault();
    try {
      const r = await fetch(`${API}/billings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: Number(patientId),
          amount: Number(amount),
          status: 'Pending',
          description
        })
      });
      if (!r.ok) throw new Error('Failed to create bill');
      setMsg('Bill generated successfully.');
      setPatientId('');
      setAmount('');
      setDescription('');
      fetchAdminData();
    } catch (err) {
      setMsg(err.message);
    }
  };

  if(!user || user.role !== 'admin') 
    return <div className="card"><h2>403 - Access Denied</h2><p>Only an administrator should access this area.</p></div>; 

  return (
    <div className="card">
      <h2>Admin Dashboard: {user.name}</h2>
      <p>Role: <b>{user.role}</b></p>
      
      <h3 style={{marginTop: '20px'}}>System-Wide Patient Records</h3>
      <table>
        <thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead>
        <tbody>
          {patients.map(x => (<tr key={x.id}><td>{x.id}</td><td>{x.name}</td><td>{x.email}</td></tr>))}
        </tbody>
      </table>

      <h3 style={{marginTop: '25px'}}>Generate Patient Bill</h3>
      <form onSubmit={handleCreateBill} className="form" style={{boxShadow: 'none', padding: 0}}>
        <input placeholder="Patient ID" value={patientId} onChange={e => setPatientId(e.target.value)} required />
        <input type="number" placeholder="Amount ($)" value={amount} onChange={e => setAmount(e.target.value)} required />
        <input placeholder="Description (e.g. Consultation & Lab Tests)" value={description} onChange={e => setDescription(e.target.value)} required />
        <button>Create Bill</button>
      </form>

      <h3 style={{marginTop: '25px'}}>Hospital Billings Overview</h3>
      <table>
        <thead><tr><th>Bill ID</th><th>Patient ID</th><th>Amount</th><th>Status</th><th>Description</th></tr></thead>
        <tbody>
          {bills.map(b => (<tr key={b.id}><td>{b.id}</td><td>{b.patientId}</td><td>${b.amount}</td><td><b>{b.status}</b></td><td>{b.description}</td></tr>))}
        </tbody>
      </table>
    </div>
  ); 
}