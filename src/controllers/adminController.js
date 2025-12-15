import User from "../models/User.js";
import JobEmail from "../models/JobEmail.js";

export const getAllUsersForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "10");
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.aggregate([
        {
          $lookup: {
            from: "jobemails",
            localField: "_id",
            foreignField: "userId",
            as: "emails",
          },
        },
        {
          $addFields: {
            emailsSent: { $size: "$emails" },

            sent: {
              $size: {
                $filter: {
                  input: "$emails",
                  as: "e",
                  cond: { $eq: ["$$e.status", "sent"] },
                },
              },
            },
            failed: {
              $size: {
                $filter: {
                  input: "$emails",
                  as: "e",
                  cond: { $eq: ["$$e.status", "failed"] },
                },
              },
            },
            queued: {
              $size: {
                $filter: {
                  input: "$emails",
                  as: "e",
                  cond: { $eq: ["$$e.status", "queued"] },
                },
              },
            },
            sending: {
              $size: {
                $filter: {
                  input: "$emails",
                  as: "e",
                  cond: { $eq: ["$$e.status", "sending"] },
                },
              },
            },
            bounced: {
              $size: {
                $filter: {
                  input: "$emails",
                  as: "e",
                  cond: { $eq: ["$$e.status", "bounced"] },
                },
              },
            },
          },
        },
        {
          $project: {
            name: 1,
            email: 1,
            role: 1,
            createdAt: 1,
            emailsSent: 1,
            sent: 1,
            failed: 1,
            queued: 1,
            sending: 1,
            bounced: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]),

      User.countDocuments(),
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("ADMIN USERS ERROR:", err);
    res.status(500).json({ success: false, message: "Failed to load users" });
  }
};

// PATCH /api/admin/users/:id/make-admin
export const makeUserAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: "admin" },
      { new: true }
    );

    res.json({
      success: true,
      message: `${user.name} promoted to admin`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await JobEmail.deleteMany({ userId: req.params.id });

    res.json({
      success: true,
      message: "User removed successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
