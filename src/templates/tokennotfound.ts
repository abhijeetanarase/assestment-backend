import dotenv from "dotenv";
dotenv.config(); 


const tokennotfound = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification Error</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            background-color: #f8fafc;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: #1e293b;
          }
          .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            padding: 2rem;
            max-width: 480px;
            width: 90%;
            text-align: center;
          }
          .icon {
            font-size: 3rem;
            color: #ef4444;
            margin-bottom: 1rem;
          }
          h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
          }
          p {
            color: #64748b;
            margin-bottom: 1.5rem;
            line-height: 1.5;
          }
          .btn {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          .btn:hover {
            background-color: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✖</div>
          <h1>Verification Failed</h1>
          <p>Verification token is required to verify your email address.</p>
          <a href="${process.env.FRONTEND_URL}/request-verification" class="btn">Request New Verification Link</a>
        </div>
      </body>
      </html>
    `

export default tokennotfound
