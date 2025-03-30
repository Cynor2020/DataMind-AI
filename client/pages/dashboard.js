// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/router';
// import axios from 'axios';
// import { toast } from 'react-toastify';

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// const Dashboard = () => {
//   const [userData, setUserData] = useState(null);
//   const router = useRouter();

//   useEffect(() => {
//     const fetchDashboard = async () => {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         toast.error('Please login first');
//         router.push('/login');
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_URL}/dashboard`, {
//           headers: { Authorization: token },
//         });
//         setUserData(response.data);
//       } catch (error) {
//         toast.error(error.response?.data?.message || 'Failed to load dashboard');
//         router.push('/login');
//       }
//     };

//     fetchDashboard();
//   }, [router]);

//   if (!userData) return <div>Loading...</div>;

//   return (
//     <div>
//       <h1>Welcome, {userData.username}!</h1>
//       <h2>Your History</h2>
//       {userData.history.length > 0 ? (
//         <ul>
//           {userData.history.map((item, index) => (
//             <li key={index}>{JSON.stringify(item)}</li>  // Tum apna custom format bana sakte ho
//           ))}
//         </ul>
//       ) : (
//         <p>No history available yet.</p>
//       )}
//     </div>
//   );
// };

// export default Dashboard;






// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/router';
// import axios from 'axios';
// import { toast } from 'react-toastify';

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// const Dashboard = () => {
//   const [userData, setUserData] = useState(null);
//   const [file, setFile] = useState(null);
//   const router = useRouter();

//   useEffect(() => {
//     const fetchDashboard = async () => {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         toast.error('Please login first');
//         router.push('/login');
//         return;
//       }

//       try {
//         const response = await axios.get(`${API_URL}/dashboard`, {
//           headers: { Authorization: token },
//         });
//         setUserData(response.data);
//       } catch (error) {
//         toast.error(error.response?.data?.message || 'Failed to load dashboard');
//         router.push('/login');
//       }
//     };

//     fetchDashboard();
//   }, [router]);

//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//   };

//   const handleFileUpload = async (e) => {
//     e.preventDefault();
//     if (!file) {
//       toast.error('Please select a file');
//       return;
//     }

//     const token = localStorage.getItem('token');
//     const formData = new FormData();
//     formData.append('file', file);

//     try {
//       await axios.post(`${API_URL}/upload`, formData, {
//         headers: {
//           Authorization: token,
//           'Content-Type': 'multipart/form-data',
//         },
//       });
//       toast.success('File uploaded successfully!');
      
//       const response = await axios.get(`${API_URL}/dashboard`, {
//         headers: { Authorization: token },
//       });
//       setUserData(response.data);
//       setFile(null);
//     } catch (error) {
//       toast.error(error.response?.data?.message || 'File upload failed');
//     }
//   };

//   if (!userData) return <div>Loading...</div>;

//   return (
//     <div style={{ padding: '20px' }}>
//       <h1>Welcome, {userData.username}!</h1>

//       {/* File Upload Section */}
//       <h2>Upload a File</h2>
//       <form onSubmit={handleFileUpload} style={{ marginBottom: '20px' }}>
//         <input
//           type="file"
//           accept=".csv,.txt,.pdf"
//           onChange={handleFileChange}
//           style={{ marginRight: '10px' }}
//         />
//         <button type="submit" style={{ padding: '5px 10px' }}>Upload</button>
//       </form>

//       {/* History Section */}
//       <h2>Your History</h2>
//       {userData.history.length > 0 ? (
//         <ul>
//           {userData.history.map((item, index) => (
//             <li key={index}>{JSON.stringify(item)}</li>
//           ))}
//         </ul>
//       ) : (
//         <p>No history available yet.</p>
//       )}

//       {/* My Files Section */}
//       <h2>My Files</h2>
//       {userData.files.length > 0 ? (
//         <ul style={{ listStyle: 'none', padding: 0 }}>
//           {userData.files.map((file, index) => (
//             <li
//               key={index}
//               style={{
//                 padding: '10px',
//                 border: '1px solid #ddd',
//                 marginBottom: '5px',
//                 borderRadius: '5px',
//               }}
//             >
//               <strong>{file.filename}</strong> {file.filetype ? `(${file.filetype.toUpperCase()})` : ''}<br />
//               Uploaded: {new Date(file.upload_date).toLocaleString()}
//             </li>
//           ))}
//         </ul>
//       ) : (
//         <p>No files uploaded yet.</p>
//       )}
//     </div>
//   );
// };

// export default Dashboard;





import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [file, setFile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        router.push('/login');
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/dashboard`, {
          headers: { Authorization: token },
        });
        setUserData(response.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load dashboard');
        router.push('/login');
      }
    };

    fetchDashboard();
  }, [router]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          Authorization: token,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('File uploaded successfully!');
      
      const response = await axios.get(`${API_URL}/dashboard`, {
        headers: { Authorization: token },
      });
      setUserData(response.data);
      setFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'File upload failed');
    }
  };

  const handleFileDownload = async (fileId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/download/${fileId}`, {
        headers: { Authorization: token },
        responseType: 'blob', // Binary data ke liye
      });

      // File ko download karne ke liye browser mein trigger karo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', userData.files.find(f => f._id === fileId).filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('File downloaded successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Download failed');
    }
  };

  if (!userData) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, {userData.username}!</h1>

      {/* File Upload Section */}
      <h2>Upload a File</h2>
      <form onSubmit={handleFileUpload} style={{ marginBottom: '20px' }}>
        <input
          type="file"
          accept=".csv,.txt,.pdf"
          onChange={handleFileChange}
          style={{ marginRight: '10px' }}
        />
        <button type="submit" style={{ padding: '5px 10px' }}>Upload</button>
      </form>

      {/* History Section
      <h2>Your History</h2>
      {userData.history.length > 0 ? (
        <ul>
          {userData.history.map((item, index) => (
            <li key={index}>{JSON.stringify(item)}</li>
          ))}
        </ul>
      ) : (
        <p>No history available yet.</p>
      )} */}

      {/* My Files Section */}
      <h2>My Files</h2>
      {userData.files.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {userData.files.map((file, index) => (
            <li
              key={index}
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                marginBottom: '5px',
                borderRadius: '5px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong>{file.filename}</strong> {file.filetype ? `(${file.filetype.toUpperCase()})` : ''}<br />
                Uploaded: {new Date(file.upload_date).toLocaleString()}
              </div>
              <button
                onClick={() => handleFileDownload(file._id)}
                style={{ padding: '5px 10px', cursor: 'pointer' }}
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No files uploaded yet.</p>
      )}
    </div>
  );
};

export default Dashboard;