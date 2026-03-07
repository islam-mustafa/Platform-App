
const authRoute = require('./authRoute')
const userRoute = require('./userRoute')
const gradeRoute = require('./gradeRoute')
const subjectRoute = require('./subjectRoute')
const sectionRoute = require('./sectionRoute')
const lessonRoute = require('./lessonRoute')
const mountRoutes =(app)=>{
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/users', userRoute);
app.use("/api/v1/grades", gradeRoute);
app.use('/api/v1/subjects', subjectRoute);
app.use('/api/v1/sections', sectionRoute);
app.use('/api/v1/lessons', lessonRoute);

}

module.exports = mountRoutes