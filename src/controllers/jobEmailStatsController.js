// controllers/jobEmailStatsController.js
import JobEmailStats from "../models/JobEmailStats.js";
import { getJobEmailStatsService } from "./emailController.js";

export const getEmailStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Pagination defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let stats = await JobEmailStats.findOne({ userId });

    if (!stats) {
      return res.json({
        success: true,
        stats: {
          page,
          limit,
          total: 0,
          recruiters: [],
          lastSync: null,
        },
      });
    }

    const sortedRecruiters = [...stats.recruiters].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    const total = sortedRecruiters.length;

    // Paginate sorted array
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedRecruiters = sortedRecruiters.slice(start, end);

    return res.json({
      success: true,
      stats: {
        page,
        limit,
        total,
        recruiters: paginatedRecruiters,
        lastSync: stats.lastSync,
      },
    });
  } catch (err) {
    console.error("❌ getEmailStats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const syncJobEmailStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Step 1: Compute stats using your existing logic
    const computedStats = await getJobEmailStatsService(userId);

    // Convert grouped object → array
    // const recruiters = Object.values(computedStats);
    const recruiters = Object.values(computedStats).map((r) => ({
      email: String(r.email || "").toLowerCase(),
      sentCount: Number(r.sentCount || 0),
      failedCount: Number(r.failedCount || 0),
      receivedCount: Number(r.receivedCount || 0),
      lastReply: r.lastReply || null,
      updatedAt: new Date(),
    }));

    // Step 2: Upsert (create or update)
    const stats = await JobEmailStats.findOneAndUpdate(
      { userId },
      {
        recruiters,
        lastSync: new Date(),
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: "Synced successfully",
      stats,
    });
  } catch (err) {
    console.error("❌ syncJobEmailStats error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
