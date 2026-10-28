@echo off
echo Setting up HydroWatch - Smart Water Leak Detection & Night-Flow Analytics (AquaSentinel)...
cd frontend
call npm install
cd ..
cd backend
call mvn clean install -DskipTests
cd ..
echo Setup completed!
