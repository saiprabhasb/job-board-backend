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
  

module.exports = router;
