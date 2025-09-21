const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Admin ID is required'],
    index: true
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      'user_created',
      'user_updated',
      'user_deleted',
      'user_activated',
      'user_deactivated',
      'user_password_reset',
      'user_list_viewed',
      'question_created',
      'question_updated',
      'question_deleted',
      'question_activated',
      'question_deactivated',
      'assessment_viewed',
      'assessment_deleted',
      'data_exported',
      'system_settings_updated',
      'admin_login',
      'admin_logout',
      'bulk_operation',
      'database_backup',
      'database_restore',
      'security_alert',
      'privacy_action',
      'content_moderation'
    ]
  },
  targetType: {
    type: String,
    required: [true, 'Target type is required'],
    enum: ['user', 'question', 'assessment', 'system', 'admin', 'data', 'security']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  targetIdentifier: {
    type: String, // email, questionId, or other identifier
    trim: true
  },
  details: {
    description: {
      type: String,
      required: [true, 'Action description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    previousValues: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    newValues: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    affectedFields: [String],
    bulkOperationCount: {
      type: Number,
      min: 0
    },
    exportedDataType: {
      type: String,
      enum: ['user_data', 'assessment_data', 'system_logs', 'analytics', 'full_backup']
    },
    exportedRecordCount: {
      type: Number,
      min: 0
    }
  },
  metadata: {
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    sessionId: {
      type: String,
      trim: true
    },
    requestId: {
      type: String,
      trim: true
    },
    apiEndpoint: {
      type: String,
      trim: true
    },
    httpMethod: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    },
    responseStatus: {
      type: Number,
      min: 100,
      max: 599
    },
    processingTime: {
      type: Number, // in milliseconds
      min: 0
    },
    location: {
      country: String,
      state: String,
      city: String,
      timezone: String
    }
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: [
      'user_management',
      'content_management',
      'data_management',
      'system_administration',
      'security',
      'privacy',
      'analytics',
      'maintenance',
      'compliance'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'partial', 'pending'],
    default: 'success'
  },
  errorDetails: {
    errorCode: String,
    errorMessage: String,
    stackTrace: String,
    resolution: String
  },
  compliance: {
    gdprRelevant: {
      type: Boolean,
      default: false
    },
    hipaaRelevant: {
      type: Boolean,
      default: false
    },
    dataRetentionDays: {
      type: Number,
      default: 2555 // 7 years for compliance
    },
    auditRequired: {
      type: Boolean,
      default: true
    }
  },
  tags: [String], // for categorization and filtering
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for performance and compliance
adminLogSchema.index({ adminId: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ targetType: 1, targetId: 1 });
adminLogSchema.index({ severity: 1, createdAt: -1 });
adminLogSchema.index({ category: 1, createdAt: -1 });
adminLogSchema.index({ status: 1 });
adminLogSchema.index({ 'compliance.gdprRelevant': 1 });
adminLogSchema.index({ 'compliance.hipaaRelevant': 1 });
adminLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 220752000 }); // 7 years TTL

// Virtual for human-readable action description
adminLogSchema.virtual('actionDescription').get(function() {
  const actionMap = {
    'user_created': 'Created new user account',
    'user_updated': 'Updated user information',
    'user_deleted': 'Deleted user account',
    'user_activated': 'Activated user account',
    'user_deactivated': 'Deactivated user account',
    'user_password_reset': 'Reset user password',
    'question_created': 'Created new assessment question',
    'question_updated': 'Updated assessment question',
    'question_deleted': 'Deleted assessment question',
    'question_activated': 'Activated assessment question',
    'question_deactivated': 'Deactivated assessment question',
    'assessment_viewed': 'Viewed user assessment data',
    'assessment_deleted': 'Deleted assessment data',
    'data_exported': 'Exported platform data',
    'system_settings_updated': 'Updated system settings',
    'admin_login': 'Admin user logged in',
    'admin_logout': 'Admin user logged out',
    'bulk_operation': 'Performed bulk operation',
    'database_backup': 'Created database backup',
    'database_restore': 'Restored database from backup',
    'security_alert': 'Security alert triggered',
    'privacy_action': 'Privacy-related action performed',
    'content_moderation': 'Content moderation action'
  };
  
  return actionMap[this.action] || this.action;
});

// Method to create a log entry
adminLogSchema.statics.createLog = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create admin log:', error);
    throw error;
  }
};

// Method to get logs by admin
adminLogSchema.statics.getByAdmin = function(adminId, limit = 50, skip = 0) {
  return this.find({ adminId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('adminId', 'name email');
};

// Method to get logs by action type
adminLogSchema.statics.getByAction = function(action, limit = 50, skip = 0) {
  return this.find({ action })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('adminId', 'name email');
};

// Method to get security-relevant logs
adminLogSchema.statics.getSecurityLogs = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    $or: [
      { severity: { $in: ['high', 'critical'] } },
      { category: 'security' },
      { action: { $in: ['admin_login', 'user_password_reset', 'security_alert'] } }
    ],
    createdAt: { $gte: startDate }
  }).sort({ createdAt: -1 });
};

// Method to get compliance logs
adminLogSchema.statics.getComplianceLogs = function(type = 'gdpr', days = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const query = {
    createdAt: { $gte: startDate }
  };
  
  if (type === 'gdpr') {
    query['compliance.gdprRelevant'] = true;
  } else if (type === 'hipaa') {
    query['compliance.hipaaRelevant'] = true;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Method to get activity summary
adminLogSchema.statics.getActivitySummary = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const summary = await this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          action: '$action',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        count: { $sum: 1 },
        admins: { $addToSet: '$adminId' }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        totalCount: { $sum: '$count' },
        dailyBreakdown: {
          $push: {
            date: '$_id.date',
            count: '$count',
            adminCount: { $size: '$admins' }
          }
        }
      }
    },
    { $sort: { totalCount: -1 } }
  ]);
  
  return summary;
};

module.exports = mongoose.model('AdminLog', adminLogSchema);
