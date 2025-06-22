import knex from 'knex'
import path from 'path'
import fs from 'fs'

// Ensure database directory exists
const dbDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Database configuration
export const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.join(dbDir, 'characters.db')
  },
  useNullAsDefault: true,
  pool: {
    min: 1,
    max: 1
  }
})

// Initialize database schema
export async function initializeDatabase() {
  try {
    // Characters table
    if (!(await db.schema.hasTable('characters'))) {
      await db.schema.createTable('characters', (table) => {
        table.increments('id').primary()
        table.string('name').notNullable()
        table.text('description')
        table.text('base_prompt').notNullable()
        table.text('negative_prompt')
        table.json('tags')
        table.string('lora_path')
        table.float('lora_strength').defaultTo(0.8)
        table.timestamps(true, true)
      })
    }

    // Character images table
    if (!(await db.schema.hasTable('character_images'))) {
      await db.schema.createTable('character_images', (table) => {
        table.increments('id').primary()
        table.integer('character_id').references('id').inTable('characters').onDelete('CASCADE')
        table.string('image_path').notNullable()
        table.string('thumbnail_path')
        table.text('prompt_used')
        table.json('parameters')
        table.boolean('is_primary').defaultTo(false)
        table.timestamps(true, true)
      })
    }

    // Generation history table
    if (!(await db.schema.hasTable('generation_history'))) {
      await db.schema.createTable('generation_history', (table) => {
        table.increments('id').primary()
        table.integer('character_id').references('id').inTable('characters').onDelete('SET NULL')
        table.string('image_path').notNullable()
        table.text('prompt')
        table.json('parameters')
        table.string('workflow_type')
        table.timestamp('generated_at').defaultTo(db.fn.now())
      })
    }

    // LoRA models table
    if (!(await db.schema.hasTable('lora_models'))) {
      await db.schema.createTable('lora_models', (table) => {
        table.increments('id').primary()
        table.string('name').notNullable()
        table.string('file_path').notNullable()
        table.string('trigger_words')
        table.text('description')
        table.string('base_model').defaultTo('flux')
        table.json('metadata')
        table.timestamps(true, true)
      })
    }

    // Character style presets
    if (!(await db.schema.hasTable('style_presets'))) {
      await db.schema.createTable('style_presets', (table) => {
        table.increments('id').primary()
        table.integer('character_id').references('id').inTable('characters').onDelete('CASCADE')
        table.string('name').notNullable()
        table.text('style_prompt')
        table.json('parameters')
        table.timestamps(true, true)
      })
    }

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

// Cleanup function
export async function closeDatabase() {
  await db.destroy()
}