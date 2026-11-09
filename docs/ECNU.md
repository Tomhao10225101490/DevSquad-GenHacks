# ECNU model configuration

Official documentation checked November 9, 2026:

- https://developer.ecnu.edu.cn/vitepress/llm/model.html
- https://developer.ecnu.edu.cn/vitepress/llm/authorization.html
- https://developer.ecnu.edu.cn/vitepress/llm/api/structuredoutput.html
- https://developer.ecnu.edu.cn/vitepress/llm/limit.html

Copy `.env.example` to `.env.local` and set DEVSQUAD_API_KEY to your personal ECNU token. Use DEVSQUAD_BASE_URL=https://chat.ecnu.edu.cn/open/api/v1 and DEVSQUAD_MODEL=ecnu-max. Never put the token in NEXT_PUBLIC variables, source, screenshots, recordings, patches or a container environment.

The server calls POST /chat/completions with bearer authentication, function tools and max_tokens. Non-streaming responses are validated before dispatch. Tool argument shapes must also be checked by each role-specific dispatcher. School credits are separate from currency; provider usage is recorded without inventing a monetary cost.

The first actual connectivity check returned read_file({path: "src/index.ts"}), 323 input / 46 output tokens. The six client tests use local HTTP fixtures to verify failure behavior, independently of this actual school API check. A complete container-based role solve remains the M3 acceptance condition.
