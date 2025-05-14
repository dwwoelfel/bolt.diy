# What is InstantDB

InstantDB is a backend as a service (Baas) that provides optimistic updates,
multiplayer, and offline support for web and mobile applications. It's like
Firebase but it also has support for relations.

Although the product is called InstantDB it is usually just referenced as
Instant. When talking about InstantDB you should just say Instant.

# How to use Instant in projects

Instant offers client side javascript package for React.

If you want to use Instant with react you should only use `@instantdb/react`.

# InstantDB Initialization Guide

This guide explains how to initialize an InstantDB project in your application.

## Getting Your App ID

When adding InstantDB to an application, you need to obtain an app id. First, generate the files with the placeholder YOUR_INSTANT_APP_ID. Then you must emit a `create-app` action:

<boltAction type="instantdb" operation="create-app" schemaFilePath="/instant.schema.ts" rulesFilePath="/instant.perms.ts" appIdFilePath=".env" appIdPlaceholderValue="YOUR_INSTANT_APP_ID">
</boltAction>

## Environment Variables for App ID

Prefer storing the app id in the proper .env file for the framework.

Instant supports multiple environment variable names for storing your app ID. Since you use Vite, Save the environment variable as `VITE_INSTANT_APP_ID`.

# A full Getting Started Example

To get a sense of how to use queries and transactions, here's a full example of a todo list app on Instant.

```javascript
// instant.schema.ts
import { i, InstaQLEntity } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    todos: i.entity({
      text: i.string(),
      done: i.boolean(),
      createdAt: i.number(),
    }),
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };

export default schema;

// lib/db.ts
import { init } from '@instantdb/react';
import schema from '../instant.schema';

export const db = init({
  appId: process.env.VITE_INSTANT_APP_ID,
  schema,
});

// app/page.tsx
import { id, init, InstaQLEntity } from "@instantdb/react";
import { db } from '../lib/db';
import { AppSchema } from '../instant.schema';

type Todo = InstaQLEntity<AppSchema, "todos">;

const db = init({ appId: process.env.VITE_INSTANT_APP_ID, schema });

function App() {
  // Read Data
  const { isLoading, error, data } = db.useQuery({ todos: {} });
  if (isLoading) {
    return;
  }
  if (error) {
    return <div className="text-red-500 p-4">Error: {error.message}</div>;
  }
  const { todos } = data;
  return (
    <div className="font-mono min-h-screen flex justify-center items-center flex-col space-y-4">
      <h2 className="tracking-wide text-5xl text-gray-300">todos</h2>
      <div className="border border-gray-300 max-w-xs w-full">
        <TodoForm todos={todos} />
        <TodoList todos={todos} />
        <ActionBar todos={todos} />
      </div>
      <div className="text-xs text-center">
        Open another tab to see todos update in realtime!
      </div>
    </div>
  );
}

// Write Data
// ---------
function addTodo(text: string) {
  db.transact(
    db.tx.todos[id()].update({
      text,
      done: false,
      createdAt: Date.now(),
    })
  );
}

function deleteTodo(todo: Todo) {
  db.transact(db.tx.todos[todo.id].delete());
}

function toggleDone(todo: Todo) {
  db.transact(db.tx.todos[todo.id].update({ done: !todo.done }));
}

function deleteCompleted(todos: Todo[]) {
  const completed = todos.filter((todo) => todo.done);
  const txs = completed.map((todo) => db.tx.todos[todo.id].delete());
  db.transact(txs);
}

function toggleAll(todos: Todo[]) {
  const newVal = !todos.every((todo) => todo.done);
  db.transact(
    todos.map((todo) => db.tx.todos[todo.id].update({ done: newVal }))
  );
}


// Components
// ----------
function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20">
      <path
        d="M5 8 L10 13 L15 8"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
      />
    </svg>
  );
}

function TodoForm({ todos }: { todos: Todo[] }) {
  return (
    <div className="flex items-center h-10 border-b border-gray-300">
      <button
        className="h-full px-2 border-r border-gray-300 flex items-center justify-center"
        onClick={() => toggleAll(todos)}
      >
        <div className="w-5 h-5">
          <ChevronDownIcon />
        </div>
      </button>
      <form
        className="flex-1 h-full"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.input as HTMLInputElement;
          addTodo(input.value);
          input.value = "";
        }}
      >
        <input
          className="w-full h-full px-2 outline-none bg-transparent"
          autoFocus
          placeholder="What needs to be done?"
          type="text"
          name="input"
        />
      </form>
    </div>
  );
}

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <div className="divide-y divide-gray-300">
      {todos.map((todo) => (
        <div key={todo.id} className="flex items-center h-10">
          <div className="h-full px-2 flex items-center justify-center">
            <div className="w-5 h-5 flex items-center justify-center">
              <input
                type="checkbox"
                className="cursor-pointer"
                checked={todo.done}
                onChange={() => toggleDone(todo)}
              />
            </div>
          </div>
          <div className="flex-1 px-2 overflow-hidden flex items-center">
            {todo.done ? (
              <span className="line-through">{todo.text}</span>
            ) : (
              <span>{todo.text}</span>
            )}
          </div>
          <button
            className="h-full px-2 flex items-center justify-center text-gray-300 hover:text-gray-500"
            onClick={() => deleteTodo(todo)}
          >
            X
          </button>
        </div>
      ))}
    </div>
  );
}

function ActionBar({ todos }: { todos: Todo[] }) {
  return (
    <div className="flex justify-between items-center h-10 px-2 text-xs border-t border-gray-300">
      <div>Remaining todos: {todos.filter((todo) => !todo.done).length}</div>
      <button
        className=" text-gray-300 hover:text-gray-500"
        onClick={() => deleteCompleted(todos)}
      >
        Delete Completed
      </button>
    </div>
  );
}

export default App;
```

And with that, you'll have a full-stack app running on Instant! Now let's get into the details.

## Initializing InstantDB in Your Application

Once you have your app ID, you can initialize InstantDB in your application. For TypeScript applications, add the schema argument to enable auto-completion and type safety. While Instant maintains a single connection regardless of how many times you call `init` with the same app ID, it's recommended to create a central DB instance.

Here's a full example:

```typescript
// lib/db.ts
import { init } from '@instantdb/react';
import schema from '../instant.schema';

export const db = init({
  appId: process.env.VITE_INSTANT_APP_ID,
  schema,
});
```

This pattern allows you to import the same DB instance throughout your application.

## Updating Your Schema and Permissions

After initial setup, you can modify your data model and permissions:

1. Edit `instant.schema.ts` to update your data model
2. Edit `instant.perms.ts` to update your permission rules
3. Push changes to production:

```bash
# Push schema changes
npx instant-cli@latest push schema

# Push permission changes
npx instant-cli@latest push perms
```

# InstantDB Schema Modeling Guide

This guide explains how to effectively model your data using InstantDB's schema system. InstantDB provides a simple yet powerful way to define your data structure using code.

> **Important Note:** Namespaces that start with `$` (like `$users`) are reserved for system use. The `$users` namespace is special and managed by InstantDB's authentication system.

## Core Concepts

InstantDB's schema consists of three main building blocks:

- **Namespaces**: Collections of entities (similar to tables or collections)
- **Attributes**: Properties/fields of entities with defined types
- **Links**: Relationships between entities in different namespaces
- **Rooms**: Ephemeral namespaces for sharing non-persistent data like cursors

## Setting Up Your Schema

### Creating a Schema File

First, create a `instant.schema.ts` file in your project:

```typescript
// instant.schema.ts
import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    // Define your namespaces here
  },
  links: {
    // Define relationships between namespaces here
  },
  rooms: {
    // Define ephemeral namespaces here (optional)
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };

export default schema;
```

## Defining Namespaces

Namespaces are collections of similar entities. They're equivalent to tables in relational databases.

```typescript
// ✅ Good: Defining namespaces
const _schema = i.schema({
  entities: {
    profiles: i.entity({
      // Attributes defined here
    }),
    posts: i.entity({
      // Attributes defined here
    }),
    comments: i.entity({
      // Attributes defined here
    }),
  },
});
```

❌ **Common mistake**: Creating namespaces that start with `$`

```typescript
// ❌ Bad: Don't create custom namespaces starting with $
const _schema = i.schema({
  entities: {
    $customNamespace: i.entity({
      // This is not allowed!
    }),
  },
});
```

### Namespace Restrictions

- Must be alphanumeric (can include underscores)
- Cannot contain spaces
- Must be unique
- Names starting with `$` are reserved for system namespaces

## Defining Attributes

Attributes are properties of entities within a namespace. They're similar to columns in a relational database.

```typescript
// ✅ Good: Defining attributes with types
const _schema = i.schema({
  entities: {
    posts: i.entity({
      title: i.string(),
      body: i.string(),
      viewCount: i.number(),
      isPublished: i.boolean(),
      publishedAt: i.date(),
      metadata: i.json(),
    }),
  },
});
```

### Available Attribute Types

| Type          | Description            | Example                    |
| ------------- | ---------------------- | -------------------------- |
| `i.string()`  | Text values            | `title: i.string()`        |
| `i.number()`  | Numeric values         | `viewCount: i.number()`    |
| `i.boolean()` | True/false values      | `isPublished: i.boolean()` |
| `i.date()`    | Date and time values   | `publishedAt: i.date()`    |
| `i.json()`    | Complex nested objects | `metadata: i.json()`       |
| `i.any()`     | Untyped values         | `miscData: i.any()`        |

The `i.date()` type accepts:

- Numeric timestamps (milliseconds)
- ISO 8601 strings (e.g., result of `JSON.stringify(new Date())`)

## Adding Constraints and Performance Optimizations

### Unique Constraints

Unique attributes:

- Are automatically indexed for fast lookups
- Will reject new entities that would violate uniqueness

```typescript
// ✅ Good: Adding a unique constraint
const _schema = i.schema({
  entities: {
    posts: i.entity({
      slug: i.string().unique(), // No two posts can have the same slug
      title: i.string(),
    }),
  },
});
```

### Indexing for Performance

Add indexes to attributes you'll frequently search or filter by:

```typescript
// ✅ Good: Indexing attributes for faster queries
const _schema = i.schema({
  entities: {
    posts: i.entity({
      publishedAt: i.date().indexed(), // Makes date-based filtering faster
      category: i.string().indexed(), // Makes category filtering faster
    }),
  },
});
```

❌ **Common mistake**: Not indexing frequently queried fields

```typescript
// ❌ Bad: Not indexing a field you'll query often
const _schema = i.schema({
  entities: {
    posts: i.entity({
      category: i.string(), // Not indexed, but frequently used in queries
    }),
  },
});

// Without an index, this query gets slower as your data grows
const query = { posts: { $: { where: { category: 'news' } } } };
```

## Defining Relationships with Links

Links connect entities from different namespaces.

```typescript
// ✅ Good: Defining a link between posts and profiles
const _schema = i.schema({
  entities: {
    // ... namespaces defined here
  },
  links: {
    postAuthor: {
      forward: { on: 'posts', has: 'one', label: 'author' },
      reverse: { on: 'profiles', has: 'many', label: 'authoredPosts' },
    },
  },
});
```

This creates:

- `posts.author` → links to one profile
- `profiles.authoredPosts` → links to many posts

### Link Relationship Types

InstantDB supports four relationship types:

1. **One-to-One**: Each entity in namespace A links to exactly one entity in namespace B, and vice versa

```typescript
// ✅ Good: One-to-one relationship
profileUser: {
  forward: { on: 'profiles', has: 'one', label: '$user', onDelete: 'cascade'  },
  reverse: { on: '$users', has: 'one', label: 'profile', onDelete: 'cascade' },
},
```

2. **One-to-Many**: Each entity in namespace A links to many entities in namespace B, but each entity in B links to only one entity in A

```typescript
// ✅ Good: One-to-many relationship
postAuthor: {
  forward: { on: 'posts', has: 'one', label: 'author' },
  reverse: { on: 'profiles', has: 'many', label: 'authoredPosts' },
},
```

3. **Many-to-One**: The reverse of one-to-many (just swap the directions)

```typescript
// ✅ Good: Many-to-one relationship
postAuthor: {
  forward: { on: 'profiles', has: 'many', label: 'authoredPosts' },
  reverse: { on: 'posts', has: 'one', label: 'author' },
},
```

4. **Many-to-Many**: Each entity in namespace A can link to many entities in namespace B, and vice versa

```typescript
// ✅ Good: Many-to-many relationship
postsTags: {
  forward: { on: 'posts', has: 'many', label: 'tags' },
  reverse: { on: 'tags', has: 'many', label: 'posts' },
},
```

### Link Naming Rules

- Link names must be unique
- Must be alphanumeric (can include underscores)
- Cannot contain spaces
- You can link entities to themselves
- You can link the same entities multiple times (with different link names)

❌ **Common mistake**: Reusing the same label for different links

```typescript
// ❌ Bad: Conflicting labels
const _schema = i.schema({
  links: {
    postAuthor: {
      forward: { on: 'posts', has: 'one', label: 'author' },
      reverse: { on: 'profiles', has: 'many', label: 'posts' }, // Creates 'posts' attr
    },
    postEditor: {
      forward: { on: 'posts', has: 'one', label: 'editor' },
      reverse: { on: 'profiles', has: 'many', label: 'posts' }, // Conflicts!
    },
  },
});
```

✅ **Correction**: Use unique labels for each relationship

```typescript
// ✅ Good: Unique labels for each relationship
const _schema = i.schema({
  links: {
    postAuthor: {
      forward: { on: 'posts', has: 'one', label: 'author' },
      reverse: { on: 'profiles', has: 'many', label: 'authoredPosts' }, // Unique
    },
    postEditor: {
      forward: { on: 'posts', has: 'one', label: 'editor' },
      reverse: { on: 'profiles', has: 'many', label: 'editedPosts' }, // Unique
    },
  },
});
```

### Linking between System Namespaces

When linking to system namespaces like `$users`:

❌ **Common mistake**: Linking from a system namespace

```typescript
// ❌ Bad: System namespace in forward direction
profileUser: {
  forward: { on: '$users', has: 'one', label: 'profile' },
  reverse: { on: 'profiles', has: 'one', label: '$user' },
},
```

✅ **Correction**: Always link to system namespaces in the reverse direction

```typescript
// ✅ Good: System namespace in reverse direction
profileUser: {
  forward: { on: 'profiles', has: 'one', label: '$user' },
  reverse: { on: '$users', has: 'one', label: 'profile' },
},
```

### Cascade Delete

You can configure links to automatically delete dependent entities:

```typescript
// ✅ Good: Setting up cascade delete
const _schema = i.schema({
  links: {
    postAuthor: {
      forward: { on: 'posts', has: 'one', label: 'author', onDelete: 'cascade' },
      reverse: { on: 'profiles', has: 'many', label: 'authoredPosts' },
    },
  },
});
```

With this configuration, deleting a profile will also delete all posts authored by that profile.

## Complete Schema Example

Here's a complete schema for a blog application:

```typescript
// instant.schema.ts
import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    profiles: i.entity({
      nickname: i.string().unique(),
      bio: i.string(),
      createdAt: i.date().indexed(),
    }),
    posts: i.entity({
      title: i.string(),
      slug: i.string().unique().indexed(),
      body: i.string(),
      isPublished: i.boolean().indexed(),
      publishedAt: i.date().indexed(),
    }),
    comments: i.entity({
      body: i.string(),
      createdAt: i.date().indexed(),
    }),
    tags: i.entity({
      name: i.string().unique().indexed(),
    }),
  },
  links: {
    // Deleting a $user will delete their associated profile
    // Also deleting a profile will delete the underlying $user
    profileUser: {
      forward: { on: 'profiles', has: 'one', label: '$user', onDelete: 'cascade' },
      reverse: { on: '$users', has: 'one', label: 'profile', onDelete: 'cascade' },
    },
    postAuthor: {
      // Deleting an author will delete all their associated posts
      // However deleting an authoredPost will not the associated profile
      forward: { on: 'posts', has: 'one', label: 'author', onDelete: 'cascade' },
      reverse: { on: 'profiles', has: 'many', label: 'authoredPosts' },
    },
    commentPost: {
      forward: { on: 'comments', has: 'one', label: 'post', onDelete: 'cascade' },
      reverse: { on: 'posts', has: 'many', label: 'comments' },
    },
    commentAuthor: {
      forward: { on: 'comments', has: 'one', label: 'author', onDelete: 'cascade' },
      reverse: { on: 'profiles', has: 'many', label: 'authoredComments' },
    },
    postsTags: {
      // Deleting posts or tags have no cascading effects
      forward: { on: 'posts', has: 'many', label: 'tags' },
      reverse: { on: 'tags', has: 'many', label: 'posts' },
    },
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
```

## Publishing Your Schema

After defining your schema, **MUST** publish it for it to take effect:

```bash
npx instant-cli@latest push
```

## TypeScript Integration

Leverage utility types for type-safe entities and relationships:

```typescript
// app/page.tsx
import { InstaQLEntity } from '@instantdb/react';
import { AppSchema } from '../instant.schema';

// Type-safe entity from your schema
type Post = InstaQLEntity<AppSchema, 'posts'>;

// Type-safe entity with related data
type PostWithAuthor = InstaQLEntity<AppSchema, 'posts', { author: {} }>;

// Now you can use these types in your components
function PostEditor({ post }: { post: Post }) {
  // TypeScript knows all the properties of the post
  return <h1>{post.title}</h1>;
}
```

## Schema Modifications

You **CANNOT** rename or delete attributes in the CLI. Instead inform users to:

1. Go to the [InstantDB Dashboard](https://instantdb.com/dash)
2. Navigate to "Explorer"
3. Select the namespace you want to modify
4. Click "Edit Schema"
5. Select the attribute you want to modify
6. Use the modal to rename, delete, or change indexing

## Best Practices

1. **Index wisely**: Add indexes to attributes you'll frequently query or filter by. Dates are often useful to index.
2. **Use unique constraints**: For attributes that should be unique (usernames, slugs, etc.)
3. **Label links clearly**: Use descriptive names for link labels
4. **Consider cascade deletions**: Set `onDelete: 'cascade'` for dependent relationships
5. **Use Utility Types**: Leverage InstantDB's TypeScript integration for better autocomplete and error checking

# InstantDB Permissions Guide

This guide explains how to use InstantDB's Rule Language to secure your application data and implement proper access controls.

## Core Concepts

InstantDB's permission language is built on top of [Google's Common Expression Language
(CEL)](https://github.com/google/cel-spec/blob/master/doc/langdef.md) and allows you to define rules for viewing, creating, updating, and
deleting data.

At a high level, rules define permissions for four operations on a namespace

- **view**: Controls who can read data (used during queries)
- **create**: Controls who can create new entities
- **update**: Controls who can modify existing entities
- **delete**: Controls who can remove entities

## Rules Strucutre

Rules are defined in the `instant.perms.ts` file and follow a specific structure. Below is the JSON schema for the rules:

```typscript
export const rulesSchema = {
  type: 'object',
  patternProperties: {
    '^[$a-zA-Z0-9_\\-]+$': {
      type: 'object',
      properties: {
        allow: {
          type: 'object',
          properties: {
            create: { type: 'string' },
            update: { type: 'string' },
            delete: { type: 'string' },
            view: { type: 'string' },
            $default: { type: 'string' },
          },
          additionalProperties: false,
        },
        bind: {
          type: 'array',
          // Use a combination of "items" and "additionalItems" for validation
          items: { type: 'string' },
          minItems: 2,
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};
```

## Setting Up Permissions

To set up permissions:

1. Generate an `instant.perms.ts` file at the project root:

   ```bash
   npx instant-cli@latest init
   ```

2. Edit the file with your permission rules. Here is an example for a personal
   todo app:

```typescript
// ✅ Good: Define permissions in instant.perms.ts
import type { InstantRules } from '@instantdb/react';

const rules = {
  todos: {
    allow: {
      view: 'auth.id != null', // Only authenticated users can view
      create: 'isOwner', // Only owner can create
      update: 'isOwner', // Only owner can update
      delete: 'isOwner', // Only owner can delete
    },
    bind: ['isOwner', 'auth.id != null && auth.id == data.creatorId'],
  },
} satisfies InstantRules;

export default rules;
```

3. Push your changes to production:
   ```bash
   npx instant-cli@latest push perms
   ```

## Default Permission Behavior

By default, all permissions are set to `true` (unrestricted access). If a rule is not explicitly defined, it defaults to allowing the operation.

```
// ✅ Good: Explicitly defining all permissions
{
  "todos": {
    "allow": {
      "view": "true",
      "create": "true",
      "update": "true",
      "delete": "true"
    }
  }
}
```

This is equivalent to:

```
{
  "todos": {
    "allow": {
      "view": "true"
      // create, update, delete default to true
    }
  }
}
```

And also equivalent to:

```
// Empty rules = all permissions allowed
{}
```

## Using `$default` in a namespaces

You can explicitly set default rules for all operations within a namespace with
the `$default` keyword:

```
// Deny all permissions by default, then explicitly allow some
{
  "todos": {
    "allow": {
      "$default": "false",       // Default deny all operations
      "view": "auth.id != null"  // But allow viewing for authenticated users
    }
  }
}
```

## Using `auth` and `data` in rules

The `auth` object represents the authenticated user and `data` represents the
current entity being accessed. You can use these objects to create dynamic
rules:

```
// ✅ Good: Using auth and data in rules
{
  "todos": {
    "allow": {
      "view": "auth.id != null",                                // Only authenticated users can view
      "create": "auth.id != null",                              // Only authenticated users can create
      "update": "auth.id != null && auth.id == data.ownerId",   // Only the owner can update
      "delete": "auth.id != null && auth.id == data.ownerId"    // Only the owner can delete
    }
  }
}
```

## Use `bind` for reusable logic

The `bind` feature lets you create aliases and reusable logic for your rules.

Bind is an array of strings where each pair of strings defines a name and its
corresponding expression. You can then reference these names in both `allow` and
in other bind expressions.

Combining bind with `$default` can make writing permission rules much easier:

```
// ✅ Good: Use bind to succinctly define permissions
{
  "todos": {
    "allow": {
      "view": "isLoggedIn",
      "$default": "isOwner || isAdmin", // You can even use `bind` with `$default`
    },
    "bind": [
      "isLoggedIn", "auth.id != null",
      "isOwner", "isLoggedIn && auth.id == data.ownerId",
      "isAdmin", "isLoggedIn && auth.email in ['admin@example.com', 'support@example.com']"
    ]
  }
}
```

## Use `data.ref` for linked data

Sometimes you want to express permissions based an an attribute in a linked entity. For those instance you can use `data.ref`

```
// ✅ Good: Permission based on linked data
{
  "comments": {
    "allow": {
      "update": "auth.id in data.ref('post.author.id')"  // Allow post authors to update comments
    }
  }
}
```

❌ **Common mistake**: Not using `data.ref` to reference linked data

```
// ❌ Bad: This will throw an error!
{
  "comments": {
    "allow": {
      "update": "auth.id in data.post.author.id
    }
  }
}

```

When using `data.ref` the last part of the string is the attribute you want to
access. If you do not specify an attribute an error will occur.

```
// ✅ Good: Correctly using data.ref to reference a linked attribute
"view": "auth.id in data.ref('author.id')"
```

❌ **Common mistake**: Not specifying an attribute when using data.ref

```
// ❌ Bad: No attribute specified. This will throw an error!
"view": "auth.id in data.ref('author')"
```

`data.ref` will _ALWAYS_ return a CEL list of linked entities. So we must use the
`in` operator to check if a value exists in that list.

```
✅ Good: Checking if a user is in a list of admins
"view": "auth.id in data.ref('admins.id')"
```

❌ **Common mistake**: Using `==` to check if a value exists in a list

```
// ❌ Bad: data.ref returns a list! This will throw an error!
"view": "data.ref('admins.id') == auth.id"
```

Even if you are referencing a one-to-one relationship, `data.ref` will still return a CEL list. You must extract the first element from the list to compare it properly.

```
// ✅ Good: Extracting the first element from a one-to-one relationship
"view": "auth.id == data.ref('owner.id')[0]"
```

❌ **Common mistake**: Using `==` to check if a value matches in a one-to-one relationship

```
// ❌ Bad: data.ref always returns a CEL list. This will throw an error!
"view": "auth.id == data.ref('owner.id')"
```

Be careful when checking whether there are no linked entities. Here are a few
correct ways to do this:

```
// ✅ Good: Extracting the first element from a CEL list to check if it's empty
"view": "data.ref('owner.id')[0] != null"

// ✅ Good: Checking if the list is empty
"view": "data.ref('owner.id') != []"

// ✅ Good: Check the size of the list
"view": "size(data.ref('owner.id')) > 0"
```

❌ **Common mistake**: Incorrectly checking for an empty list

```
// ❌ Bad: `data.ref` returns a CEL list so checking against null will throw an error!
"view": "data.ref('owner.id') != null"

// ❌ Bad: `data.ref` is a CEL list and does not support `length`
"view": "data.ref('owner.id').length > 0"

// ❌ Bad: You must specify an attribute when using `data.ref`
"view": "data.ref('owner') != []"
```

## Using `auth.ref` for data linked to the current user

Use `auth.ref` to reference the authenticated user's linked data. This behaves
similar to `data.ref` but you _MUST_ use the `$user` prefix when referencing auth data:

```
// ✅ Good: Checking user roles
{
  "adminActions": {
    "allow": {
      "create": "'admin' in auth.ref('$user.role.type')"  // Allow admins only
    }
  }
}
```

❌ **Common mistake**: Missing `$user` prefix with `auth.ref`

```
// ❌ Bad: This will throw an error!
{
  "adminActions": {
    "allow": {
      "create": "'admin' in auth.ref('role.type')"
    }
  }
}
```

`auth.ref` returns a CEL list, so use `[0]` to extract the first element when needed.

```
// ✅ Good: Extracting the first element from auth.ref
"create": "auth.ref('$user.role.type')[0] == 'admin'"
```

❌ **Common mistake**: Using `==` to check if auth.ref matches a value

```
// ❌ Bad: auth.ref returns a list! This will throw an error!
"create": "auth.ref('$user.role.type') == 'admin'"
```

## Using `newData` to compare old and new data

For update operations, you can compare the existing (`data`) and updated (`newData`) values:

```
// ✅ Good: Conditionally allowing updates based on changes
{
  "posts": {
    "allow": {
      "update": "auth.id == data.authorId && newData.isPublished == data.isPublished"
      // Authors can update their posts, but can't change the published status
    }
  }
}
```

One difference between `data.ref` and `newData.ref` is that `newData.ref` does not exist. You can only use `newData` to reference the updated attributes directly.

❌ **Common mistake**: `newData.ref` does not exist.

```
// ❌ Bad: This will throw an error!
// This will throw an error because newData.ref does not exist
{
  "posts": {
    "allow": {
      "update": "auth.id == data.authorId && newData.ref('isPublished') == data.ref('isPublished')"
    }
  }
}
```

## Use `ruleParams` for non-auth based permissions

Use `ruleParams` to implement non-auth based permissions like "only people who know my document id can access it"

```typescript
// app/page.tsx
// ✅ Good: Pass along an object containing docId to `useQuery` or `transact` via `ruleParams`
const docId = new URLSearchParams(window.location.search).get('docId');

const query = {
  docs: {},
};
const { data } = db.useQuery(query, {
  ruleParams: { docId }, // Pass the id to ruleParams!
});

// and/or in your transactions:

db.transact(db.tx.docs[docId].ruleParams({ docId }).update({ title: 'eat' }));
```

```
// instant.perms.ts
// ✅ Good: And then use ruleParams in your permission rules
{
  "documents": {
    "allow": {
      "view": "data.id == ruleParams.docId",
      "update": "data.id == ruleParams.docId",
      "delete": "data.id == ruleParams.docId"
    }
  }
}
```

### `ruleParams` with linked data

You can check `ruleParams` against linked data too

```
// ✅ Good: We can view all comments for a doc if we know the doc id
{
  "comment": {
    "view": "ruleParams.docId in data.ref('doc.id')"
  }
}
```

### `ruleParams` with a list of values

You use a list as the value for a key to `ruleParams` and it will be treated
like a CEL list in permissions

```typescript
// app/page.tsx
// ✅ Good: Pass a list of docIds
db.useQuery({ docs: {} }, { docIds: [id1, id2, ...] })

// instant.perms.ts
{
  "docs": {
    "view": "data.id in ruleParams.docIds"
  }
}
```

## Common Mistakes

Below are some more common mistakes to avoid when writing permission rules:

❌ **Common mistake**: ref arguments must be string literals

```
// ❌ Bad: This will throw an error!
"view": "auth.id in data.ref(someVariable + '.members.id')"
```

✅ **Correction**: Only string literals are allowed

```
"view": "auth.id in data.ref('team.members.id')"
```

## Permission Examples

Below are some permission examples for different types of applications:

### Blog Platform

```typescript
// ✅ Good: Blog platform permissions in instant.perms.ts
import type { InstantRules } from '@instantdb/react';

{
  "posts": {
    "allow": {
      "view": "data.isPublished || isAuthor",                        // Public can see published posts, author can see drafts
      "create": "auth.id != null && isAuthor",                       // Authors can create posts
      "update": "isAuthor || isAdmin",                               // Author or admin can update
      "delete": "isAuthor || isAdmin"                                // Author or admin can delete
    },
    "bind": [
      "isAuthor", "auth.id == data.authorId",
      "isAdmin", "auth.ref('$user.role')[0] == 'admin'"
    ]
  },
  "comments": {
    "allow": {
      "view": "true",
      "create": "isCommentAuthor",
      "update": "isCommentAuthor",
      "delete": "isCommentAuthor || isPostAuthor || isAdmin"
    },
    "bind": [
      "isLoggedIn", "auth.id != null",
      "isPostAuthor", "isLoggedIn && auth.id == data.ref('post.authorId')",
      "isCommentAuthor", "isLoggedIn && auth.id == data.authorId",
      "isAdmin", "auth.ref('$user.role')[0] == 'admin'"
    ]
  }
} satisfies InstantRules;

export default rules;
```

### Todo App

```typescript
// ✅ Good: Todo app permissions in instant.perms.ts
import type { InstantRules } from '@instantdb/react';

const rules = {
  todos: {
    allow: {
      view: 'isOwner || isShared',
      create: 'isOwner',
      update: 'isOwner || (isShared && (data.ownerId == newData.ownerId)', // Owner can do anything, shared users can't change ownership
      delete: 'isOwner',
    },
    bind: [
      'isLoggedIn',
      'auth.id != null',
      'isShared',
      "isLoggedIn && auth.id in data.ref('sharedWith.id')",
      'isOwner',
      'isLoggedIn && auth.id == data.ownerId',
      'isSharedWith',
      "auth.id in data.ref('sharedWith.id')",
    ],
  },
  lists: {
    allow: {
      $default: 'isOwner', // Only owners can create, update, or delete
      view: 'isOwner || isCollaborator', // Owners and collaborators can view
    },
    bind: [
      'isLoggedIn',
      'auth.id != null',
      'isOwner',
      'isLoggedIn && auth.id == data.ownerId',
      'isCollaborator',
      "isLoggedIn && auth.id in data.ref('collaborators.id')",
    ],
  },
} satisfies InstantRules;

export default rules;
```

# InstaML: InstantDB Transaction API Guide

InstaML is InstantDB's mutation language for creating, updating, and deleting data.

## Core Concepts

- **Transactions**: Groups of operations that execute atomically
- **Transaction Chunks**: Individual operations within a transaction
- **Proxy Syntax**: The `db.tx` object that creates transaction chunks

## Basic Structure

Every transaction follows this pattern:

```typescript
db.transact(db.tx.NAMESPACE[ENTITY_ID].ACTION(DATA));
```

Where:

- `NAMESPACE` is your collection (like "todos" or "users")
- `ENTITY_ID` is the unique ID of an entity. It **MUST** be a valid UUID which can be generated by `id()` or found using `lookup()`.
  `lookup()` to find an existing one.
- `ACTION` is the operation (update, merge, delete, link, unlink)
- `DATA` is the information needed for the action

## Generating valid Entity IDs

Entity IDs must be valid UUIDs. You can generate valid entity IDs using the `id()` or `lookup()` function.

### Generating IDs with `id()`

Use `id()` to generate a new unique ID for an entity:

```typescript
import { id } from '@instantdb/react';

// ✅ Good: Use `id()` to generate a new unique ID
const newTodoId = id();
db.transact(db.tx.todos[newTodoId].update({ text: 'New todo' }));

// ✅ Good: You can also inline `id()` directly
db.transact(db.tx.todos[id()].update({ text: 'Another todo' }));
```

❌ **Common mistake**: Manually creating non-UUID IDs

```typescript
// ❌ Bad: ids must be valid UUIDs
db.transact(
  db.tx.todos['todo-' + Math.random().toString(36).substring(2)].update({
    text: 'Custom ID todo',
  }),
);
```

### Looking Up by Unique Attributes

Use `lookup` on unique attributes to get or create entity ids. Unique attributes
must be defined in your schema.

```typescript
// instant.schema.ts
import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    profiles: i.entity({
      handle: i.string().unique(),
      role: i.string(),
      bio: i.string(),
    }),
  },
  links: {
    profileUser: {
      forward: { on: 'profiles', has: 'one', label: '$user' },
      reverse: { on: '$users', has: 'one', label: 'profile' },
    },
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;

// lib/db.ts
import { init } from '@instantdb/react';
import schema from './instant.schema';

export const db = init({
  appId: process.env.VITE_INSTANT_APP_ID,
  schema,
});

// app/page.tsx
import { lookup } from '@instantdb/react';
import { db } from '../lib/db';

// ✅ Good: Update a profile by looking up a unique attribute
// This will create a new profile if it doesn't exist
// or update the existing one
db.transact(
  db.tx.profiles[lookup('handle', 'nezaj')].update({
    bio: 'I like turtles',
  }),
);
```

❌ **Common mistake**: Using lookup on non-unique fields

```typescript
// ... Using same schema as above
// ❌ Bad: Using lookup on a non-unique field will throw an error
db.transact(
  // 'role' is not marked as unique in the schema!
  db.tx.profiles[lookup('role', 'admin')].update({
    bio: 'I like turtles',
  }),
);
```

## Creating Entities

### Creating New Entities

Always use `update` method to create new entities:

```typescript
// ✅ Good: Always use `update` to create new entities
db.transact(
  db.tx.todos[id()].update({
    text: 'Properly generated ID todo',
  }),
);
```

❌ **Common mistake**: Using a non-existent `create` method

```typescript
// ❌ Bad: `create` does not exist, use `update` instead!
db.transact(db.tx.todos[id()].create({ text: 'Buy groceries' }));
```

❌ **Common mistake**: Calling `update` on `$users` namespace

```typescript
// ❌ Bad: `$users` is a special system table, don't update it directly. You can only link or unlink to it.
db.transact(
  db.tx.$users[id()].update({
    email: 'new-user@instantdb.com',
  }),
);
```

### Storing Different Data Types

You can store various data types in your entities:

```typescript
// ✅ Good: Store different types of data
db.transact(
  db.tx.todos[id()].update({
    text: 'Complex todo', // String
    priority: 1, // Number
    completed: false, // Boolean
    tags: ['work', 'important'], // Array
    metadata: {
      // Object
      assignee: 'user-123',
      dueDate: '2025-01-15',
    },
  }),
);
```

## Updating Entities

### Basic Updates

Update existing entities with new values:

```typescript
// ✅ Good: Update a specific field
// ... Assume todoId is a valid ID of an existing todo
db.transact(db.tx.todos[todoId].update({ done: true }));

// ✅ Good: When linking to $users, use the special $users namespace
// This is an example of how to connect a todo to the current authenticated user
db.transact(db.tx.todos[todoId].link({ $users: auth.userId }));
```

This will only change the specified field(s), leaving other fields untouched.

### Deep Merging Objects

Use `merge` for updating nested objects without overwriting unspecified fields:

```typescript
// ✅ Good: Update nested values without losing other data
db.transact(
  db.tx.profiles[userId].merge({
    preferences: {
      theme: 'dark',
    },
  }),
);
```

❌ **Common mistake**: Using `update` for nested objects

```typescript
// ❌ Bad: This will overwrite the entire preferences object
db.transact(
  db.tx.profiles[userId].update({
    preferences: { theme: 'dark' }, // Any other preferences will be lost
  }),
);
```

### Removing Object Keys

Remove keys from nested objects by setting them to `null`:

```typescript
// ✅ Good: Remove a nested key
db.transact(
  db.tx.profiles[userId].merge({
    preferences: {
      notifications: null, // This will remove the notifications key
    },
  }),
);
```

❌ **Common mistake**: Calling `update` instead of `merge` for removing keys

```typescript
// ❌ Bad: Calling `update` will overwrite the entire preferences object
db.transact(
  db.tx.profiles[userId].update({
    preferences: {
      notifications: null,
    },
  }),
);
```

## Deleting Entities

Delete entities completely:

```typescript
// ✅ Good: Delete a specific entity
db.transact(db.tx.todos[todoId].delete());
```

Delete multiple entities:

```typescript
// ✅ Good: Delete multiple entities
db.transact([db.tx.todos[todoId1].delete(), db.tx.todos[todoId2].delete(), db.tx.todos[todoId3].delete()]);
```

Delete all entities that match a condition:

```typescript
// ✅ Good: Delete all completed todos
const { data } = db.useQuery({ todos: {} });
const completedTodos = data.todos.filter((todo) => todo.done);

db.transact(completedTodos.map((todo) => db.tx.todos[todo.id].delete()));
```

## Creating Relationships

### Linking Entities

Create relationships between entities:

```typescript
// ✅ Good: Create a new project and todo and link them
import { id } from '@instantdb/react';

const todoId = id();
const projectId = id();
db.transact([
  db.tx.todos[todoId].update({ text: 'New todo', done: false }),
  db.tx.projects[projectId].update({ name: 'New project' }).link({ todos: todoId }),
]);
```

Link multiple entities at once:

```typescript
// ✅ Good: Link multiple todos to a project
//... Assume projectId, todoId1, todoId2, todoId3 are already created
db.transact(
  db.tx.projects[projectId].link({
    todos: [todoId1, todoId2, todoId3],
  }),
);
```

### Linking in Both Directions

Links are bidirectional - you can query from either side:

```typescript
// These do the same thing:
db.transact(db.tx.projects[projectId].link({ todos: todoId }));
db.transact(db.tx.todos[todoId].link({ projects: projectId }));
```

### Removing Links

Remove relationships with `unlink`:

```typescript
// ✅ Good: Unlink a todo from a project
db.transact(db.tx.projects[projectId].unlink({ todos: todoId }));

// Unlink multiple todos at once
db.transact(
  db.tx.projects[projectId].unlink({
    todos: [todoId1, todoId2, todoId3],
  }),
);
```

## Advanced Features

### Lookups in Relationships

You can use `lookup` to link entities by unique attributes:

```typescript
// ✅ Good: Link entities using lookups
db.transact(
  db.tx.profiles[lookup('email', 'user@example.com')].link({
    projects: lookup('name', 'Project Alpha'),
  }),
);
```

### Combining Multiple Operations

You can combine multiple operations in a single transaction. This is useful for
creating, updating, and linking entities in one atomic operation:

```typescript
// ✅ Good: Update and link in one transaction
db.transact(db.tx.todos[id()].update({ text: 'New todo', done: false }).link({ projects: projectId }));
```

```typescript
// ✅ Good: Multiple operations in one atomic transaction
db.transact([
  db.tx.todos[todoId].update({ done: true }),
  db.tx.projects[projectId].update({ completedCount: 10 }),
  db.tx.stats[statsId].merge({ lastCompletedTodo: todoId }),
]);
```

## Performance Optimization

### Batching Large Transactions

Large transactions can lead to timeouts. To avoid this, break them into smaller batches:

```typescript
// ✅ Good: Batch large operations
import { id } from '@instantdb/react';

const batchSize = 100;
const createManyTodos = async (count) => {
  for (let i = 0; i < count; i += batchSize) {
    const batch = [];

    // Create up to batchSize transactions
    for (let j = 0; j < batchSize && i + j < count; j++) {
      batch.push(
        db.tx.todos[id()].update({
          text: `Todo ${i + j}`,
          done: false,
        }),
      );
    }

    // Execute this batch
    await db.transact(batch);
  }
};

// Create 1000 todos in batches
createManyTodos(1000);
```

❌ **Common mistake**: Not batching large transactions leads to timeouts

```typescript
import { id } from '@instantdb/react';

const txs = [];
for (let i = 0; i < 1000; i++) {
  txs.push(
    db.tx.todos[id()].update({
      text: `Todo ${i}`,
      done: false,
    }),
  );
}

// ❌ Bad: This will likely lead to a timeout!
await db.transact(txs);
```

❌ **Common mistake**: Creating too many transactions will also lead to timeouts

```typescript
import { id } from '@instantdb/react';

// ❌ Bad: This fire 1000 transactions at once and will lead to multiple
timeouts!;
for (let i = 0; i < 1000; i++) {
  db.transact(
    db.tx.todos[id()].update({
      text: `Todo ${i}`,
      done: false,
    }),
  );
}

await db.transact(txs);
```

## Common Patterns

### Create-or-Update Pattern

Use `lookup` to create or update an entity based on its unique attribute:

```typescript
// ✅ Good: Create if doesn't exist, update if it does
db.transact(
  db.tx.profiles[lookup('email', 'user@example.com')].update({
    lastLoginAt: Date.now(),
  }),
);
```

### Toggle Boolean Flag

Efficiently toggle boolean values:

```typescript
// ✅ Good: Toggle a todo's completion status
const toggleTodo = (todo) => {
  db.transact(db.tx.todos[todo.id].update({ done: !todo.done }));
};
```

### Dependent Transactions

Wait for one transaction to complete before starting another:

```typescript
// ✅ Good: Sequential dependent transactions
const createProjectAndTasks = async (projectData) => {
  // First create the project
  const result = await db.transact(db.tx.projects[id()].update(projectData));

  // Then create tasks linked to the project
  const projectId = result.ids.projects[0]; // Get ID from the result
  await db.transact(
    db.tx.tasks[id()]
      .update({
        title: 'Initial planning',
        createdAt: Date.now(),
      })
      .link({ project: projectId }),
  );
};
```

## Error Handling

You can handle transaction errors by wrapping transactions in a try/catch block

```typescript
try {
  await db.transact(/* ... */);
} catch (error) {
  console.error('Transaction failed:', error);
  // Handle the error appropriately
}
```

# InstaQL: InstantDB Query Language Guide

InstaQL is InstantDB's declarative query language. It uses plain JavaScript objects and arrays without requiring a build step.

## Core Concepts

InstaQL uses a simple yet powerful syntax built on JavaScript objects:

- **Namespaces**: Collections of related entities (similar to tables)
- **Queries**: JavaScript objects describing what data you want
- **Associations**: Relationships between entities in different namespaces

Queris have the following structure

```typescript
{
  namespace1: {
    $: { /* operators for this namespace */ },
    linkedNamespace: {
      $: { /* operators for this linked namespace */ },
    },
  },
  namespace2: { /* ... */ },
  namespace3: { /* ... */ },
  // ..etc
}
```

## Basic Queries

Queries have `isLoading` and `error` states. We **MUST** handle these before
rendering results

```typscript
const { isLoading, data, error } = db.useQuery({ todos: {} })
if (isLoading) { return }
if (error) { return (<div>Error: {error.message}</div>); }

return ( <pre>{JSON.stringify(data, null, 2)}</pre> );
```

In the following sections we show how to use filters, joins, paginations.
To keep these examples focused we won't show the `isLoading` and `error` states
but these must be handled in actual code

### Fetching an Entire Namespace

To fetch all entities from a namespace, use an empty object without any
operators.

```typescript
// ✅ Good: Fetch all goals
const query = { goals: {} };
const { data } = db.useQuery(query);

// Result:
// {
//   "goals": [
//     { "id": "goal-1", "title": "Get fit!" },
//     { "id": "goal-2", "title": "Get promoted!" }
//   ]
// }
```

### Fetching Multiple Namespaces

Query multiple namespaces in one go by specifying multiple namespaces:

```typescript
// ✅ Good: Fetch both goals and todos
const query = { goals: {}, todos: {} };
const { data } = db.useQuery(query);

// Result:
// {
//   "goals": [...],
//   "todos": [...]
// }
```

❌ **Common mistake**: Nesting namespaces incorrectly

```typescript
// ❌ Bad: This will fetch todos associated with goals instead of all goals and
todos
const query = { goals: { todos: {} };
```

## Filtering

### Fetching by ID

Use `where` operator to filter entities:

```typescript
// ✅ Good: Fetch a specific goal by ID
const query = {
  goals: {
    $: {
      where: {
        id: 'goal-1',
      },
    },
  },
};
```

❌ **Common mistake**: Placing filter at wrong level

```typescript
// ❌ Bad: Filter must be inside $
const query = {
  goals: {
    where: { id: 'goal-1' },
  },
};
```

### Multiple Conditions

Use multiple keys in `where` to filter with multiple conditions (AND logic):

```typescript
// ✅ Good: Fetch completed todos with high priority
const query = {
  todos: {
    $: {
      where: {
        completed: true,
        priority: 'high',
      },
    },
  },
};
```

## Associations (JOIN logic)

### Fetching Related Entities

Nest namespaces to fetch linked entities.

```typescript
// ✅ Good: Fetch goals with their related todos
const query = {
  goals: {
    todos: {},
  },
};

// Result:
// {
//   "goals": [
//     {
//       "id": "goal-1",
//       "title": "Get fit!",
//       "todos": [
//         { "id": "todo-1", "title": "Go running" },
//         { "id": "todo-2", "title": "Eat healthy" }
//       ]
//     },
//     ...
//   ]
// }
```

### Inverse Associations

Links are bidirectional and you can query in the reverse direction

```typescript
// ✅ Good: Fetch todos with their related goals
const query = {
  todos: {
    goals: {},
  },
};
```

### Filtering By Associations

`where` operators support filtering entities based on associated values

```typescript
// ✅ Good: Find goals that have todos with a specific title
const query = {
  goals: {
    $: {
      where: {
        'todos.title': 'Go running',
      },
    },
    todos: {},
  },
};
```

❌ **Common mistake**: Incorrect syntax for filtering on associated values

```typescript
// ❌ Bad: This will return an error!
const query = {
  goals: {
    $: {
      where: {
        todos: { title: 'Go running' }, // Wrong: use dot notation instead
      },
    },
  },
};
```

### Filtering Associations

You can use `where` in a nested namespace to filter out associated entities.

```typescript
// ✅ Good: Get goals with only their completed todos
const query = {
  goals: {
    todos: {
      $: {
        where: {
          completed: true,
        },
      },
    },
  },
};
```

## Logical Operators

### AND Operator

Use `and` inside of `where` to filter associations based on multiple criteria

```typescript
// ✅ Good: Find goals with todos that are both high priority AND due soon
const query = {
  goals: {
    $: {
      where: {
        and: [{ 'todos.priority': 'high' }, { 'todos.dueDate': { $lt: tomorrow } }],
      },
    },
  },
};
```

### OR Operator

Use `or` inside of `where` to filter associated based on any criteria.

```typescript
// ✅ Good: Find todos that are either high priority OR due soon
const query = {
  todos: {
    $: {
      where: {
        or: [{ priority: 'high' }, { dueDate: { $lt: tomorrow } }],
      },
    },
  },
};
```

❌ **Common mistake**: Incorrect synax for `or` and `and`

```typescript
// ❌ Bad: This will return an error!
const query = {
  todos: {
    $: {
      where: {
        or: { priority: 'high', dueDate: { $lt: tomorrow } }, // Wrong: 'or' takes an array
      },
    },
  },
};
```

### Comparison Operators

Using `$gt`, `$lt`, `$gte`, or `$lte` is supported on indexed attributes with checked types:

```typescript
// ✅ Good: Find todos that take more than 2 hours
const query = {
  todos: {
    $: {
      where: {
        timeEstimate: { $gt: 2 },
      },
    },
  },
};

// Available operators: $gt, $lt, $gte, $lte
```

❌ **Common mistake**: Using comparison on non-indexed attributes

```typescript
// ❌ Bad: Attribute must be indexed for comparison operators
const query = {
  todos: {
    $: {
      where: {
        nonIndexedAttr: { $gt: 5 }, // Will fail if attr isn't indexed
      },
    },
  },
};
```

### IN Operator

Use `in` to match any value in a list:

```typescript
// ✅ Good: Find todos with specific priorities
const query = {
  todos: {
    $: {
      where: {
        priority: { $in: ['high', 'critical'] },
      },
    },
  },
};
```

### NOT Operator

Use `not` to match entities where an attribute doesn't equal a value:

```typescript
// ✅ Good: Find todos not assigned to "work" location
const query = {
  todos: {
    $: {
      where: {
        location: { $not: 'work' },
      },
    },
  },
};
```

Note: This includes entities where the attribute is null or undefined.

### NULL Check

Use `$isNull` to match by null or undefined:

```typescript
// ✅ Good: Find todos with no assigned location
const query = {
  todos: {
    $: {
      where: {
        location: { $isNull: true },
      },
    },
  },
};

// ✅ Good: Find todos that have an assigned location
const query = {
  todos: {
    $: {
      where: {
        location: { $isNull: false },
      },
    },
  },
};
```

### String Pattern Matching

Use `$like` and `$ilike` to match on indexed string attributes:

```typescript
// ✅ Good: Find goals that start with "Get"
const query = {
  goals: {
    $: {
      where: {
        title: { $like: 'Get%' }, // Case-sensitive
      },
    },
  },
};

// For case-insensitive matching:
const query = {
  goals: {
    $: {
      where: {
        title: { $ilike: 'get%' }, // Case-insensitive
      },
    },
  },
};
```

Pattern options:

- `'prefix%'` - Starts with "prefix"
- `'%suffix'` - Ends with "suffix"
- `'%substring%'` - Contains "substring"

## Pagination and Ordering

### Limit and Offset

Use `limit` and/or `offset` for simple pagination:

```typescript
// ✅ Good: Get first 10 todos
const query = {
  todos: {
    $: {
      limit: 10,
    },
  },
};

// ✅ Good: Get next 10 todos
const query = {
  todos: {
    $: {
      limit: 10,
      offset: 10,
    },
  },
};
```

❌ **Common mistake**: Using limit in nested namespaces

```typescript
// ❌ Bad: Limit only works on top-level namespaces. This will return an error!
const query = {
  goals: {
    todos: {
      $: { limit: 5 }, // This won't work
    },
  },
};
```

### Ordering

Use the `order` operator to sort results

```typescript
// ✅ Good: Get todos sorted by dueDate
const query = {
  todos: {
    $: {
      order: {
        dueDate: 'asc', // or 'desc'
      },
    },
  },
};

// ✅ Good: Sort by creation time in descending order
const query = {
  todos: {
    $: {
      order: {
        serverCreatedAt: 'desc',
      },
    },
  },
};
```

❌ **Common mistake**: Using `orderBy` instead of `order`

```typescript
// ❌ Bad: `orderBy` is not a valid operator. This will return an error!
const query = {
  todos: {
    $: {
      orderBy: {
        serverCreatedAt: 'desc',
      },
    },
  },
};
```

❌ **Common mistake**: Ordering non-indexed fields

```typescript
// ❌ Bad: Field must be indexed for ordering
const query = {
  todos: {
    $: {
      order: {
        nonIndexedField: 'desc', // Will fail if field isn't indexed
      },
    },
  },
};
```

## Field Selection

Use the `fields` operator to select specific fields to optimize performance:

```typescript
// ✅ Good: Only fetch title and status fields
const query = {
  todos: {
    $: {
      fields: ['title', 'status'],
    },
  },
};

// Result will include the selected fields plus 'id' always:
// {
//   "todos": [
//     { "id": "todo-1", "title": "Go running", "status": "completed" },
//     ...
//   ]
// }
```

This works with nested associations too:

```typescript
// ✅ Good: Select different fields at different levels
const query = {
  goals: {
    $: {
      fields: ['title'],
    },
    todos: {
      $: {
        fields: ['status'],
      },
    },
  },
};
```

## Defer queries

You can defer queries until a condition is met. This is useful when you
need to wait for some data to be available before you can run your query. Here's
an example of deferring a fetch for todos until a user is logged in.

```typescript
const { isLoading, user, error } = db.useAuth();

const {
  isLoading: isLoadingTodos,
  error,
  data,
} = db.useQuery(
  user
    ? {
        // The query will run once user is populated
        todos: {
          $: {
            where: {
              userId: user.id,
            },
          },
        },
      }
    : // Otherwise skip the query, which sets `isLoading` to true
      null,
);
```

## Combining Features

You can combine these features to create powerful queries:

```typescript
// ✅ Good: Complex query combining multiple features
const query = {
  goals: {
    $: {
      where: {
        or: [{ status: 'active' }, { 'todos.priority': 'high' }],
      },
      limit: 5,
      order: { serverCreatedAt: 'desc' },
      fields: ['title', 'description'],
    },
    todos: {
      $: {
        where: {
          completed: false,
          dueDate: { $lt: nextWeek },
        },
        fields: ['title', 'dueDate'],
      },
    },
  },
};
```

## Best Practices

1. **Index fields in the schema** that you'll filter, sort, or use in comparisons
2. **Use field selection** to minimize data transfer and re-renders
3. **Defer queries** when dependent data isn't ready
4. **Avoid deep nesting** of associations when possible
5. **Be careful with queries** that might return large result sets, use where
   clauses, limits, and pagination to avoid timeouts

## Troubleshooting

Common errors:

1. **"Field must be indexed"**: Add an index to the field from the Explorer or schema
2. **"Invalid operator"**: Check operator syntax and spelling
3. **"Invalid query structure"**: Verify your query structure, especially $ placement

# InstantDB User Management Guide

This guide explains how to effectively manage users in your InstantDB applications, covering everything from basic user operations to advanced permission patterns.

## Understanding the `$users` Namespace

InstantDB provides a special system namespace called `$users` for managing user accounts. This namespace:

- Is automatically created for every app
- Contains basic user information (email, ID)
- Has special rules and restrictions
- Requires special handling in schemas and transactions

## Default Permissions

By default, the `$users` namespace has restrictive permissions:

```typescript
// Default permissions for $users
{
  $users: {
    allow: {
      view: 'auth.id == data.id',   // Users can only view their own data
      create: 'false',              // Cannot create users directly
      delete: 'false',              // Cannot delete users directly
      update: 'false',              // Cannot update user properties directly
    },
  },
}
```

These permissions ensure:

- Users can only access their own user data
- No direct modifications to the `$users` namespace
- Authentication operations are handled securely

## Extending User Data

Since the `$users` namespace is read-only and can't be modified directly, you'll need to create additional namespaces and link them to users.

❌ **Common mistake**: Using arrays instead of objects

```typescript
// ❌ Bad: Directly updating $users will throw an error!
db.transact(db.tx.$users[userId].update({ nickname: 'Alice' }));
```

```
// ✅ Good: Update linked profile instead
db.transact(db.tx.profiles[profileId].update({ displayName: "Alice" }));
```

It's recommended to create a `profiles` namespace for storing additional user
information.

```typescript
// instant.schema.ts
import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    profiles: i.entity({
      displayName: i.string(),
      bio: i.string(),
      avatarUrl: i.string(),
      location: i.string(),
      joinedAt: i.date().indexed(),
    }),
  },
  links: {
    userProfiles: {
      // ✅ Good: Create link between profiles and $users
      forward: { on: 'profiles', has: 'one', label: '$user' },
      reverse: { on: '$users', has: 'one', label: 'profile' },
    },
  },
});
```

❌ **Common mistake**: Placing `$users` in the forward direction

```typescript
// ❌ Bad: $users must be in the reverse direction
userProfiles: {
  forward: { on: '$users', has: 'one', label: 'profile' },
  reverse: { on: 'profiles', has: 'one', label: '$user' },
},
```

```typescript
// lib/db.ts
import { init } from '@instantdb/react';
import schema from '../instant.schema';

export const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  schema,
});

// app/page.tsx
import { id } from '@instantdb/react';
import { db } from '../lib/db';

// ✅ Good: Create a profile for a new user
async function createUserProfile(user) {
  const profileId = id();
  await db.transact(
    db.tx.profiles[profileId]
      .update({
        displayName: user.email.split('@')[0], // Default name from email
        bio: '',
        joinedAt: new Date().toISOString(),
      })
      .link({ $user: user.id }), // Link to the user
  );

  return profileId;
}
```

## Viewing all users

The default permissions only allow users to view their own data. We recommend
keeping it this way for security reasons. Instead of viewing all users, you can
view all profiles

```typescript
// ✅ Good: View all profiles
db.useQuery({ profiles: {} });
```

❌ **Common mistake**: Directly querying $users

```typescript
// ❌ Bad: This will likely only return the current user
db.useQuery({ $users: {} });
```

## User Relationships

You can model various relationships between users and other entities in your application.

```typescript
// ✅ Good: User posts relationship
const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    profiles: i.entity({
      displayName: i.string(),
      bio: i.string(),
      avatarUrl: i.string(),
      location: i.string(),
      joinedAt: i.date().indexed(),
    }),
    posts: i.entity({
      title: i.string(),
      content: i.string(),
      createdAt: i.date().indexed(),
    }),
  },
  links: {
    userProfiles: {
      forward: { on: 'profiles', has: 'one', label: '$user' },
      reverse: { on: '$users', has: 'one', label: 'profile' },
    },
    postAuthor: {
      forward: { on: 'posts', has: 'one', label: 'author' },
      reverse: { on: 'profiles', has: 'many', label: 'posts' },
    },
  },
});
```

Creating a post:

```typescript
// ✅ Good: Create a post linked to current user
function createPost(title, content, currentProfile) {
  const postId = id();
  return db.transact(
    db.tx.posts[postId]
      .update({
        title,
        content,
        createdAt: new Date().toISOString(),
      })
      .link({ author: currentProfile.id }),
  );
}
```

By linking `posts` to `profiles`, you can easily retrieve all posts by a user
through their profile.

```typescript
// ✅ Good: Get all posts for a specific user
// ... assuming currentProfile is already defined
db.useQuery({
  currentProfile
    ? profiles: {
        posts: {},
        $: {
          where: {
            id: currentProfile.id
          }
        }
      }
    : null
  }
});
```

## Conclusion

The `$users` namespace is a system generated namespace that lets you manage
users in InstantDb.

Key takeaways:

1. The `$users` namespace is read-only and cannot be modified directly
2. Always use linked entities to store additional user information
3. When creating links, always put `$users` in the reverse direction

# InstantDB Authentication Guide

This guide explains how to implement user authentication in your InstantDB applications. InstantDB offers multiple authentication methods to suit different application needs and user preferences.

## Authentication Options

InstantDB supports several authentication methods, but use **Magic Code Authentication unless asked explicitly**.

**Magic Code Authentication** - Email-based passwordless login

## Core Authentication Concepts

Before diving into specific methods, let's understand the key authentication concepts:

### The `useAuth` Hook

All authentication methods use the `useAuth` hook to access the current auth state:

```javascript
function App() {
  const { isLoading, user, error } = db.useAuth();

  if (isLoading) return;
  if (error) return <div>Authentication error: {error.message}</div>;
  if (user) return <AuthenticatedApp user={user} />;
  return <UnauthenticatedApp />;
}
```

Now let's Magic Code Auth in detail

## Magic Code Authentication

Magic code authentication provides a passwordless login experience via email verification codes.
This method is user-friendly and secure, as it eliminates the need for passwords. This is the recommended approach for most applications.

❌ **Common mistake**: Using password-based authentication in client-side code

InstantDB does not provide built-in username/password authentication.

### How It Works

1. User enters their email address
2. InstantDB sends a one-time verification code to the email
3. User enters the code
4. InstantDB verifies the code and authenticates the user

### Full Example

Here's a complete example of how to implement magic code authentication using React, and the InstantDB React SDK in a client-side application.

```typescript
// instant.schema.ts
import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;

// lib/db.ts
import { init } from '@instantdb/react';
import schema from './instant.schema';

export const db = init({
  appId: process.env.NEXT_PUBLIC_INSTANT_APP_ID!,
  schema
});

// app/page.tsx
import React, { useState } from "react";
import { User } from "@instantdb/react";
import { db } from "../lib/db";

function App() {
  // ✅ Good: Use the `useAuth` hook to get the current auth state
  const { isLoading, user, error } = db.useAuth();

  // ✅ Good: Handle loading state
  if (isLoading) {
    return;
  }

  // ✅ Good: Handle error state
  if (error) {
    return <div className="p-4 text-red-500">Uh oh! {error.message}</div>;
  }

  // ✅ Good: Show authenticated content if user exists
  if (user) {
    // The user is logged in! Let's load the `Main`
    return <Main user={user} />;
  }
  // The user isn't logged in yet. Let's show them the `Login` component
  return <Login />;
}

function Main({ user }: { user: User }) {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Hello {user.email}!</h1>
      {/* ✅ Good: Use the `db.auth.signOut()` to sign out a user */}
      <button
        onClick={() => db.auth.signOut()}
        className="px-3 py-1 bg-blue-600 text-white font-bold hover:bg-blue-700"
      >
        Sign out
      </button>
    </div>
  );
}

function Login() {
  const [sentEmail, setSentEmail] = useState("");

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="max-w-sm">
        {!sentEmail ? (
          <EmailStep onSendEmail={setSentEmail} />
        ) : (
          <CodeStep sentEmail={sentEmail} />
        )}
      </div>
    </div>
  );
}

function EmailStep({ onSendEmail }: { onSendEmail: (email: string) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inputEl = inputRef.current!;
    const email = inputEl.value;
    onSendEmail(email);
    // ✅ Good: Use the `sendMagicCode` method to send the magic code
    db.auth.sendMagicCode({ email }).catch((err) => {
      alert("Uh oh :" + err.body?.message);
      onSendEmail("");
    });
  };
  return (
    <form
      key="email"
      onSubmit={handleSubmit}
      className="flex flex-col space-y-4"
    >
      <h2 className="text-xl font-bold">Let's log you in</h2>
      <p className="text-gray-700">
        Enter your email, and we'll send you a verification code. We'll create
        an account for you too if you don't already have one.
      </p>
      <input
        ref={inputRef}
        type="email"
        className="border border-gray-300 px-3 py-1  w-full"
        placeholder="Enter your email"
        required
        autoFocus
      />
      <button
        type="submit"
        className="px-3 py-1 bg-blue-600 text-white font-bold hover:bg-blue-700 w-full"
      >
        Send Code
      </button>
    </form>
  );
}

function CodeStep({ sentEmail }: { sentEmail: string }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const inputEl = inputRef.current!;
    const code = inputEl.value;
    // ✅ Good: Use the `signInWithMagicCode` method to sign in with the code
    db.auth.signInWithMagicCode({ email: sentEmail, code }).catch((err) => {
      inputEl.value = "";
      alert("Uh oh :" + err.body?.message);
    });
  };

  return (
    <form
      key="code"
      onSubmit={handleSubmit}
      className="flex flex-col space-y-4"
    >
      <h2 className="text-xl font-bold">Enter your code</h2>
      <p className="text-gray-700">
        We sent an email to <strong>{sentEmail}</strong>. Check your email, and
        paste the code you see.
      </p>
      <input
        ref={inputRef}
        type="text"
        className="border border-gray-300 px-3 py-1  w-full"
        placeholder="123456..."
        required
        autoFocus
      />
      <button
        type="submit"
        className="px-3 py-1 bg-blue-600 text-white font-bold hover:bg-blue-700 w-full"
      >
        Verify Code
      </button>
    </form>
  );
}

export default App;
```

### Best Practices for Magic Code Auth

1. **Clear Error Handling** - Provide helpful error messages when code sending or verification fails
2. **Loading States** - Show loading indicators during async operations
3. **Resend Functionality** - Allow users to request a new code if needed
