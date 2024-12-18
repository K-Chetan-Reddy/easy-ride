import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import axios from 'axios';
import 'remixicon/fonts/remixicon.css';
import LocationSearchPanel from '../components/LocationSearchPanel';
import VehiclePanel from '../components/VehiclePanel';
import ConfirmRide from '../components/ConfirmRide';
import LookingForDriver from '../components/LookingForDriver';
import WaitingForDriver from '../components/WaitingForDriver';
import { SocketContext } from '../context/SocketContext';
import { UserDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import LiveTracking from '../components/LiveTracking';

const Home = () => {
    // State management
    const [pickup, setPickup] = useState('');
    const [destination, setDestination] = useState('');
    const [panelOpen, setPanelOpen] = useState(false);
    const [vehiclePanel, setVehiclePanel] = useState(false);
    const [confirmRidePanel, setConfirmRidePanel] = useState(false);
    const [vehicleFound, setVehicleFound] = useState(false);
    const [waitingForDriver, setWaitingForDriver] = useState(false);
    const [pickupSuggestions, setPickupSuggestions] = useState([]);
    const [destinationSuggestions, setDestinationSuggestions] = useState([]);
    const [activeField, setActiveField] = useState(null);
    const [fare, setFare] = useState({});
    const [vehicleType, setVehicleType] = useState(null);
    const [ride, setRide] = useState(null);

    // Refs for animations
    const panelRef = useRef(null);
    const panelCloseRef = useRef(null);
    const vehiclePanelRef = useRef(null);
    const confirmRidePanelRef = useRef(null);
    const vehicleFoundRef = useRef(null);
    const waitingForDriverRef = useRef(null);

    // Contexts
    const navigate = useNavigate();
    const { socket } = useContext(SocketContext);
    const { user } = useContext(UserDataContext);

    // Socket event handlers
    useEffect(() => {
        socket.emit('join', { userType: 'user', userId: user._id });

        socket.on('ride-confirmed', (ride) => {
            setVehicleFound(false);
            setWaitingForDriver(true);
            setRide(ride);
        });

        socket.on('ride-started', (ride) => {
            setWaitingForDriver(false);
            navigate('/riding', { state: { ride } });
        });

        return () => {
            socket.off('ride-confirmed');
            socket.off('ride-started');
        };
    }, [socket, user, navigate]);

    // Optimized Axios request functions
    const fetchSuggestions = useCallback(async (input, setSuggestions) => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
                params: { input },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setSuggestions(response.data);
        } catch {
            console.error('Error fetching suggestions');
        }
    }, []);

    const handlePickupChange = useCallback((e) => {
        setPickup(e.target.value);
        fetchSuggestions(e.target.value, setPickupSuggestions);
    }, [fetchSuggestions]);

    const handleDestinationChange = useCallback((e) => {
        setDestination(e.target.value);
        fetchSuggestions(e.target.value, setDestinationSuggestions);
    }, [fetchSuggestions]);

    const findTrip = useCallback(async () => {
        setPanelOpen(false);
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
                params: { pickup, destination },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setFare(response.data);
            setVehiclePanel(true);
        } catch {
            setVehiclePanel(false);
            console.error('Error fetching fare');
            alert('No rides available for this route');
            
        }
    }, [pickup, destination]);

    const createRide = useCallback(async () => {
        try {
            await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/create`, {
                pickup,
                destination,
                vehicleType,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
        } catch {
            console.error('Error creating ride');
        }
    }, [pickup, destination, vehicleType]);

    // Reusable animation logic
    const animatePanel = useCallback((ref, openState, properties) => {
        gsap.to(ref.current, openState ? properties.open : properties.close);
    }, []);

    useGSAP(() => {
        animatePanel(panelRef, panelOpen, { open: { height: '80%', padding: 24 }, close: { height: '0%', padding: 0 } });
        gsap.to(panelCloseRef.current, { opacity: panelOpen ? 1 : 0 });
    }, [panelOpen, animatePanel]);

    useGSAP(() => {
        animatePanel(vehiclePanelRef, vehiclePanel, { open: { transform: 'translateY(0)' }, close: { transform: 'translateY(110%)' } });
    }, [vehiclePanel, animatePanel]);

    useGSAP(() => {
        animatePanel(confirmRidePanelRef, confirmRidePanel, { open: { transform: 'translateY(0)' }, close: { transform: 'translateY(110%)' } });
    }, [confirmRidePanel, animatePanel]);

    useGSAP(() => {
        animatePanel(vehicleFoundRef, vehicleFound, { open: { transform: 'translateY(0)' }, close: { transform: 'translateY(110%)' } });
    }, [vehicleFound, animatePanel]);

    useGSAP(() => {
        animatePanel(waitingForDriverRef, waitingForDriver, { open: { transform: 'translateY(0)' }, close: { transform: 'translateY(110%)' } });
    }, [waitingForDriver, animatePanel]);

    return (
        <div className='h-screen relative overflow-hidden'>
            <img className='w-16 absolute left-5 top-5' src="https://files.oaiusercontent.com/file-Boa4mrZnMm2AXMjcyBC42X" alt="Logo" />
            <div className='h-screen w-screen'>
                <LiveTracking />
            </div>
            <div className='flex flex-col justify-end h-screen absolute top-0 w-full'>
                <div className='h-[30%] p-6 bg-white relative sm:h-[20%] sm:p-4'>
                    <h5
                        ref={panelCloseRef}
                        onClick={() => setPanelOpen(false)}
                        className='absolute opacity-0 right-6 top-6 text-2xl sm:text-xl'>
                        <i className="ri-arrow-down-wide-line"></i>
                    </h5>
                    <h4 className='text-2xl font-semibold sm:text-xl'>Find a trip</h4>
                    <form className='relative py-3' onSubmit={(e) => e.preventDefault()}>
                        <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-gray-700 rounded-full sm:h-12 sm:left-4"></div>
                        <input
                            onClick={() => { setPanelOpen(true); setActiveField('pickup'); }}
                            value={pickup}
                            onChange={handlePickupChange}
                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full sm:px-10 sm:py-1 sm:text-base'
                            type="text"
                            placeholder='Add a pick-up location'
                        />
                        <input
                            onClick={() => { setPanelOpen(true); setActiveField('destination'); }}
                            value={destination}
                            onChange={handleDestinationChange}
                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full mt-3 sm:px-10 sm:py-1 sm:text-base'
                            type="text"
                            placeholder='Enter your destination'
                        />
                    </form>
                    <button
                        onClick={findTrip}
                        className='bg-black text-white px-4 py-2 rounded-lg mt-3 w-full sm:px-3 sm:py-1 sm:text-base'>
                        Find Trip
                    </button>
                </div>
                <div ref={panelRef} className='bg-white h-0'>
                    <LocationSearchPanel
                        suggestions={activeField === 'pickup' ? pickupSuggestions : destinationSuggestions}
                        setPanelOpen={setPanelOpen}
                        setVehiclePanel={setVehiclePanel}
                        setPickup={setPickup}
                        setDestination={setDestination}
                        activeField={activeField}
                    />
                </div>
            </div>
            <div ref={vehiclePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12 sm:py-6 sm:pt-8'>
                <VehiclePanel
                    selectVehicle={setVehicleType}
                    fare={fare}
                    setConfirmRidePanel={setConfirmRidePanel}
                    setVehiclePanel={setVehiclePanel} />
            </div>
            <div ref={confirmRidePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12 sm:py-4 sm:pt-8'>
                <ConfirmRide
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}
                    setConfirmRidePanel={setConfirmRidePanel}
                    setVehicleFound={setVehicleFound} />
            </div>
            <div ref={vehicleFoundRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12 sm:py-4 sm:pt-8'>
                <LookingForDriver
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}
                    setVehicleFound={setVehicleFound} />
            </div>
            <div ref={waitingForDriverRef} className='fixed w-full z-10 bottom-0 bg-white px-3 py-6 pt-12 sm:py-4 sm:pt-8'>
                <WaitingForDriver
                    ride={ride}
                    setWaitingForDriver={setWaitingForDriver}
                    waitingForDriver={waitingForDriver} />
            </div>
        </div>
    );
};

export default Home;