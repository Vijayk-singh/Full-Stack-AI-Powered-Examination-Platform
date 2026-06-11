import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCached: GlobalMongoose;
}

let cached = global.mongooseCached;

if (!cached) {
  cached = global.mongooseCached = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongooseInstance) => {
      // Seed default subject data if database is clean
      try {
        const Subject = (await import('../models/Subject')).default;
        const Topic = (await import('../models/Topic')).default;
        
        const count = await Subject.countDocuments();
        if (count === 0) {
          const subjects = [
            { name: 'Computer Science', description: 'Computing, programming and architecture core topics.' },
            { name: 'Mathematics', description: 'Calculus, algebra, logic and numbers.' },
            { name: 'General Studies', description: 'General intelligence, history, geography and general knowledge.' }
          ];
          const createdSubjects = await Subject.create(subjects);
          
          const topics = [
            { subjectId: createdSubjects[0]._id, name: 'Database Normalization' },
            { subjectId: createdSubjects[0]._id, name: 'Process Synchronization' },
            { subjectId: createdSubjects[1]._id, name: 'Linear Algebra' },
            { subjectId: createdSubjects[2]._id, name: 'Modern History' }
          ];
          await Topic.create(topics);
          console.log('Database seeded with default subjects and topics.');
        }
      } catch (err) {
        console.error('Failed to seed default subjects:', err);
      }
      
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
