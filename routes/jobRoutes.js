const express = require('express');
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/jobs - Create a new job (Protected)
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, company, location, salary } = req.body;

  if (!title || !description || !company || !location || !salary) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newJob = new Job({
      title,
      description,
      company,
      location,
      salary,
      postedBy: req.user.id, // Gets user ID from token
    });

    await newJob.save();
    res.status(201).json({ message: 'Job posted successfully', job: newJob });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// GET /api/jobs - Fetch  jobs
router.get('/', async (req, res) => {
    try {
      const jobs = await Job.find().populate('postedBy', 'name email'); // Populates the user who posted the job
      res.status(200).json(jobs);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // POST /api/jobs/:id/apply - Apply for a job (Protected)
router.post('/:id/apply', authMiddleware, async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);
  
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
  
      // Check if the user already applied
      const alreadyApplied = job.applications.some(app => app.applicant.toString() === req.user.id);
      if (alreadyApplied) {
        return res.status(400).json({ message: 'You have already applied for this job' });
      }
  
      // Add applicant to applications array
      job.applications.push({ applicant: req.user.id });
      await job.save();
  
      res.status(200).json({ message: 'Application submitted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  // GET /api/jobs/:id/applicants - Fetch all applicants for a job (Protected)
router.get('/:id/applicants', authMiddleware, async (req, res) => {
    try {
      const job = await Job.findById(req.params.id).populate('applications.applicant', 'name email');
  
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
  
      res.status(200).json({
        jobTitle: job.title,
        applicants: job.applications.map(app => ({
          id: app.applicant._id,
          name: app.applicant.name,
          email: app.applicant.email,
          appliedAt: app.appliedAt
        }))
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  
  

module.exports = router;
