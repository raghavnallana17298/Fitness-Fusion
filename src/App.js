import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, Dumbbell, Utensils, BarChart as BarChartIcon, Download, Play, Pause, StopCircle, Flame, Beef, Wheat, Salad, Target, TrendingUp, BrainCircuit, LogOut, UserPlus, LogIn, Repeat } from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { setLogLevel } from "firebase/firestore";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: "fitness-fusion-7d33c",
  storageBucket: "fitness-fusion-7d33c.appspot.com",
  messagingSenderId: "931211549569",
  appId: "1:931211549569:web:f7a17d20c722e54a58e680",
  measurementId: "G-DJJ07F2J3H"
};
const __firebase_config = JSON.stringify(firebaseConfig);
const __app_id = 'fitness-tracker-app-react';

// --- EXERCISE DATA & MET VALUES ---
const exercisesByCategory = {
  "Chest": ["Push-ups", "Bench Press", "Dumbbell Flyes", "Incline Press"],
  "Back": ["Pull-ups", "Deadlifts", "Bent-over Rows", "Lat Pulldowns"],
  "Legs": ["Squats", "Lunges", "Leg Press", "Calf Raises"],
  "Shoulders": ["Overhead Press", "Lateral Raises", "Front Raises", "Shrugs"],
  "Arms": ["Bicep Curls", "Tricep Dips", "Hammer Curls", "Tricep Pushdowns"],
  "Core": ["Plank", "Crunches", "Leg Raises", "Russian Twists"],
  "Cardio": ["Running", "Cycling", "Jumping Jacks", "Burpees"]
};

// Metabolic Equivalent of Task values for calorie calculation
const metValues = {
    "Push-ups": 8.0, "Bench Press": 5.0, "Dumbbell Flyes": 4.0, "Incline Press": 5.0,
    "Pull-ups": 8.0, "Deadlifts": 8.0, "Bent-over Rows": 6.0, "Lat Pulldowns": 4.0,
    "Squats": 5.5, "Lunges": 4.0, "Leg Press": 5.0, "Calf Raises": 3.0,
    "Overhead Press": 5.0, "Lateral Raises": 3.0, "Front Raises": 3.0, "Shrugs": 3.0,
    "Bicep Curls": 3.0, "Tricep Dips": 4.0, "Hammer Curls": 3.0, "Tricep Pushdowns": 3.0,
    "Plank": 3.0, "Crunches": 3.8, "Leg Raises": 3.5, "Russian Twists": 3.5,
    "Running": 9.8, "Cycling": 7.5, "Jumping Jacks": 8.0, "Burpees": 10.0
};


// --- HELPER COMPONENTS ---

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 text-white p-3 rounded-lg shadow-lg border border-zinc-700">
        <p className="font-bold">{`Date: ${label}`}</p>
        <p className="text-green-500">{`Duration: ${payload[0].value} min`}</p>
      </div>
    );
  }
  return null;
};

const Modal = ({ message, onClose, isError = false }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50">
        <div className={`bg-zinc-800 border ${isError ? 'border-red-500' : 'border-zinc-700'} rounded-2xl shadow-xl p-6 m-4 max-w-sm w-full text-center`}>
            <p className="text-white text-lg mb-6">{message}</p>
            <button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500"
            >
                Close
            </button>
        </div>
    </div>
);

// --- HOME/ABOUT COMPONENT ---
const HomeSection = () => {
    const FeatureCard = ({ icon, title, description, delay }) => (
        <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/50 transform hover:-translate-y-2 transition-transform duration-300 animate-fade-in-up" style={{ animationDelay: delay }}>
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-500/10 text-green-400 mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-zinc-400">{description}</p>
        </div>
    );

    return (
        <div className="text-center mb-12">
            <style>
                {`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out forwards;
                    opacity: 0;
                }
                `}
            </style>
            <div className="animate-fade-in-up">
                <h2 className="text-3xl font-bold text-white mb-2">Welcome to Fitness Fusion</h2>
                <p className="text-lg text-zinc-300 mb-8 max-w-2xl mx-auto">The ultimate platform to seamlessly track your workouts, monitor your progress, and get intelligent dietary advice to fuel your fitness journey.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
                <FeatureCard 
                    icon={<Target size={24} />}
                    title="Track Your Workouts"
                    description="Choose from a comprehensive list of exercises, time your sessions with a built-in stopwatch, and log every detail of your workout effortlessly."
                    delay="0.2s"
                />
                <FeatureCard 
                    icon={<TrendingUp size={24} />}
                    title="Visualize Your Progress"
                    description="Stay motivated with a dynamic line chart that visualizes your workout consistency over time. Download detailed CSV reports of your history anytime."
                    delay="0.4s"
                />
                <FeatureCard 
                    icon={<BrainCircuit size={24} />}
                    title="Smart Diet Assistant"
                    description="Curious about a food? Our AI-powered assistant provides instant nutritional information and clear recommendations to support your health goals."
                    delay="0.6s"
                />
            </div>
        </div>
    );
};

// --- AUTHENTICATION COMPONENTS ---
const AuthForm = ({ isLogin, onSubmit, onToggle, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [age, setAge] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isLogin) {
            onSubmit(email, password);
        } else {
            onSubmit(email, password, name, age);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-zinc-900 p-8 rounded-2xl shadow-2xl border border-zinc-800/50">
            <h2 className="text-3xl font-bold text-white text-center mb-2">{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
            <p className="text-zinc-400 text-center mb-6">{isLogin ? 'Sign in to continue your journey.' : 'Join us to start tracking.'}</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                    <>
                        <input
                            type="text"
                            placeholder="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                            required
                        />
                        <input
                            type="number"
                            placeholder="Your Age"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                            required
                        />
                    </>
                )}
                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    required
                />
                <input
                    type="password"
                    placeholder="Password (min. 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                    required
                />
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center gap-2">
                    {isLogin ? <><LogIn size={18}/> Sign In</> : <><UserPlus size={18}/> Sign Up</>}
                </button>
            </form>
            <p className="text-center text-zinc-400 mt-6">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button onClick={onToggle} className="font-semibold text-green-500 hover:text-green-400 ml-2">
                    {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
            </p>
        </div>
    );
};

// --- PROFILE COMPONENT ---
const Profile = ({ user }) => {
    if (!user || !user.profile) {
        return <div className="text-center text-zinc-400">Loading profile...</div>;
    }

    return (
        <div className="bg-zinc-900 p-6 rounded-2xl shadow-2xl border border-zinc-800 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <User className="mr-3 text-green-500" />
                Your Profile
            </h2>
            <div className="space-y-4">
                <div className="bg-zinc-800/50 p-4 rounded-lg">
                    <p className="text-sm text-zinc-400">Name</p>
                    <p className="text-lg text-white font-semibold">{user.profile.name}</p>
                </div>
                <div className="bg-zinc-800/50 p-4 rounded-lg">
                    <p className="text-sm text-zinc-400">Email</p>
                    <p className="text-lg text-white font-semibold">{user.email}</p>
                </div>
                <div className="bg-zinc-800/50 p-4 rounded-lg">
                    <p className="text-sm text-zinc-400">Age</p>
                    <p className="text-lg text-white font-semibold">{user.profile.age}</p>
                </div>
            </div>
        </div>
    );
};


// --- DIET ASSISTANT COMPONENT ---
const DietAssistant = () => {
  const [foodQuery, setFoodQuery] = useState('');
  const [nutritionInfo, setNutritionInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getNutritionInfo = async () => {
    if (!foodQuery.trim()) {
      setError("Please enter a food item.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setNutritionInfo(null);

    const prompt = `Please provide nutritional information for "${foodQuery}". Can I eat it? Give a simple yes/no/sometimes answer and a brief explanation. Provide estimated values for calories, protein, carbohydrates, and fats.`;

    try {
        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
        const payload = { 
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        foodName: { type: "STRING" },
                        recommendation: { type: "STRING", description: "A simple 'Yes', 'No', or 'In moderation'." },
                        explanation: { type: "STRING" },
                        calories: { type: "NUMBER" },
                        protein: { type: "NUMBER" },
                        carbs: { type: "NUMBER" },
                        fats: { type: "NUMBER" }
                    },
                    required: ["foodName", "recommendation", "explanation", "calories", "protein", "carbs", "fats"]
                }
            }
        };
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();
        
        if (result.candidates && result.candidates.length > 0 &&
            result.candidates[0].content && result.candidates[0].content.parts &&
            result.candidates[0].content.parts.length > 0) {
          const jsonText = result.candidates[0].content.parts[0].text;
          const parsedJson = JSON.parse(jsonText);
          setNutritionInfo(parsedJson);
        } else {
          throw new Error("Unexpected API response format.");
        }

    } catch (e) {
      console.error("Error fetching nutritional data:", e);
      setError("Sorry, I couldn't fetch the nutritional information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const NutritionCard = ({ icon, title, value, unit, color }) => (
    <div className={`flex-1 bg-zinc-800 p-4 rounded-lg flex items-center space-x-3 min-w-[120px]`}>
        <div className={`p-2 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-zinc-400">{title}</p>
            <p className="text-lg font-bold text-white">{value} <span className="text-sm font-normal">{unit}</span></p>
        </div>
    </div>
  );

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl shadow-2xl border border-zinc-800">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
        <Utensils className="mr-3 text-green-500" />
        Diet Assistant
      </h2>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={foodQuery}
          onChange={(e) => setFoodQuery(e.target.value)}
          placeholder="e.g., 'Is grilled chicken healthy?'"
          className="flex-grow bg-zinc-800 text-white border border-zinc-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition"
        />
        <button
          onClick={getNutritionInfo}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out disabled:bg-zinc-500 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? 'Analyzing...' : 'Get Info'}
        </button>
      </div>

      {error && <div className="bg-red-900/50 text-red-300 p-3 rounded-lg text-center">{error}</div>}
      
      {isLoading && <div className="text-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div></div>}

      {nutritionInfo && (
        <div className="mt-6 bg-zinc-800/50 p-6 rounded-lg animate-fade-in">
          <h3 className="text-xl font-bold text-white mb-2">{nutritionInfo.foodName}</h3>
          <p className={`text-lg font-semibold mb-3 ${
            nutritionInfo.recommendation.toLowerCase() === 'yes' ? 'text-green-400' : 
            nutritionInfo.recommendation.toLowerCase() === 'no' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            Recommendation: {nutritionInfo.recommendation}
          </p>
          <p className="text-zinc-300 mb-6">{nutritionInfo.explanation}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <NutritionCard icon={<Flame size={20} className="text-white"/>} title="Calories" value={nutritionInfo.calories} unit="kcal" color="bg-orange-500/80"/>
              <NutritionCard icon={<Beef size={20} className="text-white"/>} title="Protein" value={nutritionInfo.protein} unit="g" color="bg-red-500/80"/>
              <NutritionCard icon={<Wheat size={20} className="text-white"/>} title="Carbs" value={nutritionInfo.carbs} unit="g" color="bg-yellow-500/80"/>
              <NutritionCard icon={<Salad size={20} className="text-white"/>} title="Fats" value={nutritionInfo.fats} unit="g" color="bg-green-500/80"/>
          </div>
        </div>
      )}
    </div>
  );
};


// --- WORKOUT COMPONENT ---
const Workout = ({ onLogWorkout }) => {
  const [selectedExercise, setSelectedExercise] = useState('');
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const countRef = useRef(null);
  const [modalMessage, setModalMessage] = useState('');

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const seconds = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleStart = () => {
    if (!selectedExercise) {
      setModalMessage("Please select an exercise to begin.");
      return;
    }
    setIsActive(true);
    countRef.current = setInterval(() => {
      setTimer((timer) => timer + 1);
    }, 1000);
  };

  const handlePause = () => {
    clearInterval(countRef.current);
    setIsActive(false);
  };

  const handleFinish = () => {
    if (timer < 10) { // Minimum 10 seconds workout
        setModalMessage("Workout is too short! Please continue for at least 10 seconds.");
        return;
    }
    clearInterval(countRef.current);
    setIsActive(false);

    // Calorie calculation
    const met = metValues[selectedExercise] || 3.5; // Default MET if not found
    const weightKg = 70; // Assuming a default user weight of 70kg (154 lbs)
    const durationMinutes = timer / 60;
    const caloriesBurned = Math.round((met * 3.5 * weightKg) / 200 * durationMinutes);

    onLogWorkout({
      duration: timer,
      exercise: selectedExercise,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      calories: caloriesBurned,
    });
    setTimer(0);
    setSelectedExercise('');
    setModalMessage(`Great job! Workout logged. You burned an estimated ${caloriesBurned} calories.`);
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl shadow-2xl border border-zinc-800">
        {modalMessage && <Modal message={modalMessage} onClose={() => setModalMessage('')} />}
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <Dumbbell className="mr-3 text-green-500" />
            New Workout
        </h2>

        <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">1. Select Your Exercise</h3>
            <div className="space-y-3">
                {Object.entries(exercisesByCategory).map(([category, exercises]) => (
                    <div key={category}>
                        <p className="font-bold text-green-400">{category}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {exercises.map(ex => (
                                <button
                                    key={ex}
                                    onClick={() => setSelectedExercise(ex)}
                                    disabled={isActive || timer > 0}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${selectedExercise === ex ? 'bg-green-500 text-white ring-2 ring-green-300' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-zinc-800/50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-white mb-3">2. Start the Timer</h3>
            <div className="text-7xl font-mono font-bold text-white tracking-widest my-4 bg-black/20 p-4 rounded-lg">
                {formatTime(timer)}
            </div>
            <div className="flex justify-center gap-4">
                {!isActive && timer === 0 && (
                    <button onClick={handleStart} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 transition-transform transform hover:scale-105">
                        <Play /> Start
                    </button>
                )}
                {isActive && (
                    <button onClick={handlePause} className="bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 transition-transform transform hover:scale-105">
                        <Pause /> Pause
                    </button>
                )}
                {!isActive && timer > 0 && (
                    <>
                        <button onClick={handleStart} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 transition-transform transform hover:scale-105">
                            <Play /> Resume
                        </button>
                        <button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 transition-transform transform hover:scale-105">
                            <StopCircle /> Finish & Log
                        </button>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};

// --- PROGRESS COMPONENT ---
const Progress = ({ workoutData }) => {
  const [modalMessage, setModalMessage] = useState('');

  const chartData = workoutData.reduce((acc, workout) => {
      const date = workout.date;
      const durationMinutes = Math.round(workout.duration / 6) / 10;
      const existing = acc.find(item => item.date === date);
      if (existing) {
          existing.duration += durationMinutes;
      } else {
          acc.push({ date, duration: durationMinutes });
      }
      return acc;
  }, []).sort((a,b) => new Date(a) - new Date(b));
  
  const summaryData = workoutData.reduce((acc, workout) => {
      const { exercise, duration, calories } = workout;
      if (!acc[exercise]) {
          acc[exercise] = { totalDuration: 0, totalCalories: 0, count: 0 };
      }
      acc[exercise].totalDuration += duration;
      acc[exercise].totalCalories += calories;
      acc[exercise].count += 1;
      return acc;
  }, {});

  const downloadReport = () => {
    if (workoutData.length === 0) {
        setModalMessage("No workout data to download.");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,Date,Exercise,Duration (seconds),Calories Burned\n";
    workoutData.forEach(row => {
        csvContent += `${row.date},${row.exercise},${row.duration},${row.calories}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fitness_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setModalMessage("Report downloaded successfully!");
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl shadow-2xl border border-zinc-800">
       {modalMessage && <Modal message={modalMessage} onClose={() => setModalMessage('')} />}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center">
            <BarChartIcon className="mr-3 text-green-500" />
            Your Progress
        </h2>
        <button onClick={downloadReport} className="mt-3 sm:mt-0 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300">
            <Download size={18} /> Download Report
        </button>
      </div>
      
      <div className="h-80 w-full bg-zinc-800/50 p-4 rounded-lg mb-8">
        {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="date" stroke="#a1a1aa" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#a1a1aa" tick={{ fontSize: 12 }} label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#a1a1aa', dy: 40 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(34, 197, 94, 0.1)'}}/>
                    <Legend wrapperStyle={{fontSize: "14px"}} />
                    <Bar dataKey="duration" fill="#22c55e" name="Workout Duration (min)" />
                </BarChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                <BarChartIcon size={48} className="mb-4" />
                <p className="text-lg">No workout data yet.</p>
                <p>Complete a workout to see your progress here!</p>
            </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Repeat className="mr-3 text-green-500" />
            Exercise Summary
        </h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-zinc-800 text-zinc-300 uppercase text-sm">
                    <tr>
                        <th className="p-3">Exercise</th>
                        <th className="p-3 text-right">Total Time</th>
                        <th className="p-3 text-right">Total Calories</th>
                        <th className="p-3 text-right">Sessions</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(summaryData).map(([exercise, data]) => (
                        <tr key={exercise} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                            <td className="p-3 font-medium">{exercise}</td>
                            <td className="p-3 text-right">{Math.floor(data.totalDuration / 60)} min {data.totalDuration % 60} sec</td>
                            <td className="p-3 text-right">{data.totalCalories} kcal</td>
                            <td className="p-3 text-right">{data.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---
export default function App() {
  const [activeTab, setActiveTab] = useState('workout');
  const [workoutData, setWorkoutData] = useState([]);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [authError, setAuthError] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  // --- Firebase Initialization ---
  useEffect(() => {
    try {
        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);
        setDb(firestoreDb);
        setAuth(firebaseAuth);
        setLogLevel('debug'); // For development
        
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (userAuth) => {
            if (userAuth) {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const profileRef = doc(firestoreDb, `artifacts/${appId}/users/${userAuth.uid}/profile`, 'data');
                const profileSnap = await getDoc(profileRef);
                if (profileSnap.exists()) {
                    setUser({ ...userAuth, profile: profileSnap.data() });
                } else {
                    setUser(userAuth); 
                }
            } else {
                setUser(null);
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();

    } catch (error) {
        console.error("Firebase initialization failed:", error);
        setModalMessage("Application could not be initialized. Please refresh.");
    }
  }, []);

  // --- Firestore Data Fetching for Workouts ---
  useEffect(() => {
    if (!user || !db) {
        setWorkoutData([]);
        return;
    };

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const dataPath = `artifacts/${appId}/users/${user.uid}/workouts`;
    const q = query(collection(db, dataPath));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setWorkoutData(data);
    }, (error) => {
        console.error("Error fetching workout data:", error);
        setModalMessage("Could not fetch workout data.");
    });

    return () => unsubscribe();

  }, [user, db]);

  const handleSignUp = async (email, password, name, age) => {
      setAuthError('');
      if (!name || !age) {
          setAuthError("Name and age are required.");
          return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userAuth = userCredential.user;
        const profileData = { name, age: parseInt(age, 10) };
        
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const profileRef = doc(db, `artifacts/${appId}/users/${userAuth.uid}/profile`, 'data');
        await setDoc(profileRef, profileData);

        setUser({ ...userAuth, profile: profileData });

      } catch (error) {
        setAuthError(error.message.replace('Firebase: ', ''));
      }
  };
  
  const handleLogin = (email, password) => {
      setAuthError('');
      signInWithEmailAndPassword(auth, email, password)
        .catch(error => setAuthError(error.message.replace('Firebase: ', '')));
  };

  const handleLogout = () => {
      signOut(auth);
      setActiveTab('workout'); // Reset tab on logout
  };

  const handleLogWorkout = async (log) => {
    if (!db || !user) {
        setModalMessage("Cannot save workout. Not connected.");
        return;
    }
    try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const dataPath = `artifacts/${appId}/users/${user.uid}/workouts`;
        await addDoc(collection(db, dataPath), log);
    } catch (error) {
        console.error("Error adding document: ", error);
        setModalMessage("Failed to save your workout. Please try again.");
    }
  };

  const TabButton = ({ tabName, icon, label }) => {
    const isActive = activeTab === tabName;
    return (
      <button
        onClick={() => setActiveTab(tabName)}
        className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-4 rounded-t-lg font-semibold transition-all duration-300 border-b-4 ${
          isActive
            ? 'bg-zinc-800 text-green-500 border-green-500'
            : 'bg-black text-zinc-400 hover:bg-zinc-800/50 border-transparent'
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  if (!isAuthReady) {
      return (
          <div className="bg-black min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
          </div>
      )
  }

  return (
    <div className="bg-black min-h-screen font-sans text-white antialiased">
      <div className="bg-black/30 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-6">
          <header className="flex justify-between items-center mb-6">
            <div className="text-left">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Fitness <span className="text-green-500">Fusion</span>
                </h1>
                <p className="mt-2 text-lg text-zinc-300">
                    {user && user.profile ? `Welcome back, ${user.profile.name}!` : 'Your all-in-one workout and diet partner.'}
                </p>
            </div>
            {user && (
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all duration-300">
                    <LogOut size={18} /> Logout
                </button>
            )}
          </header>
        </div>
        
        {user && (
            <nav className="container mx-auto px-4 flex">
                <TabButton tabName="workout" icon={<Dumbbell />} label="Workout" />
                <TabButton tabName="progress" icon={<BarChartIcon />} label="Progress" />
                <TabButton tabName="diet" icon={<Utensils />} label="Diet Assistant" />
                <TabButton tabName="profile" icon={<User />} label="Profile" />
            </nav>
        )}
      </div>
      
      <main className="container mx-auto p-4 sm:p-6">
        {modalMessage && <Modal message={modalMessage} onClose={() => setModalMessage('')} />}
        
        {!user ? (
            <>
                <HomeSection />
                <AuthForm 
                    isLogin={isLoginView}
                    onSubmit={isLoginView ? handleLogin : handleSignUp}
                    onToggle={() => {
                        setIsLoginView(!isLoginView)
                        setAuthError('');
                    }}
                    error={authError}
                />
            </>
        ) : (
            <div className="animate-fade-in">
                {activeTab === 'workout' && <Workout onLogWorkout={handleLogWorkout} />}
                {activeTab === 'progress' && <Progress workoutData={workoutData} />}
                {activeTab === 'diet' && <DietAssistant />}
                {activeTab === 'profile' && <Profile user={user} />}
            </div>
        )}
      </main>
      <footer className="text-center p-4 text-zinc-500 text-sm">
        <p>Fitness Fusion &copy; 2025. Track. Analyze. Improve.</p>
      </footer>
    </div>
  );
}