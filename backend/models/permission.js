const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    canInviteTeam: { type: Boolean, default: false },
    canEditMaterial: { type: Boolean, default: false },
    canAccessQuotes: { type: Boolean, default: false },
    canManageProject: { type: Boolean, default: false },
    canSeeAnalytics: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Permission", permissionSchema);
