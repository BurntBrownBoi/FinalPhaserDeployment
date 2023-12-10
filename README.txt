# Setup

This application has an api included that needs to be ran to access the leaderboard data. It is a springboot service
that I run seperatly from the game. The game also must be ran locally with a simple web server application. After that,
the leaderboard should be accessable.

Another comment: The database is and h2 embedded database, so the scores are only availabe when the backend is running.
And the scores will be lost if you reclone the repository.