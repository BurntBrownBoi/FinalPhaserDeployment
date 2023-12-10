class mainScene {
  preload() {
    this.load.image("player", "Assets/player.png");
    this.load.image("alien", "Assets/alien.png");
    this.load.image("bullet", "Assets/bullet.png");
  }

  create() {
    let style = { font: "20px Arial", fill: "#fff" };

    this.alien = this.physics.add.sprite(400, 300, "alien");
    this.alien.setCollideWorldBounds(true);
    this.alien.setBounce(1);
    this.alien.setVelocity(100, 100);
    this.alienSpeed = 100;
    this.nextAlienMove = 0;
    this.player = this.physics.add.sprite(100, 100, "player");

    this.createButton(50, 550, "Leaderboard", this.showLeaderboard);

    this.score = 0;
    this.scoreText = this.add.text(20, 20, "score: " + this.score, style);

    this.arrow = this.input.keyboard.createCursorKeys();
    this.bullets = this.physics.add.group();
  }

  update() {
    if (this.physics.overlap(this.player, this.alien)) {
      this.endGame();
    }

    // Use WASD for movement
    if (
      this.input.keyboard.addKey("D").isDown &&
      this.player.x < 800 - this.player.width / 2
    ) {
      this.player.x += 3;
    } else if (
      this.input.keyboard.addKey("A").isDown &&
      this.player.x > this.player.width / 2
    ) {
      this.player.x -= 3;
    }

    if (
      this.input.keyboard.addKey("S").isDown &&
      this.player.y < 600 - this.player.height / 2
    ) {
      this.player.y += 3;
    } else if (
      this.input.keyboard.addKey("W").isDown &&
      this.player.y > this.player.height / 2
    ) {
      this.player.y -= 3;
    }

    this.shoot();
    this.moveAlien();
    this.physics.overlap(this.bullets, this.alien, this.hitAlien, null, this);
  }

  shoot() {
    if (this.input.activePointer.isDown) {
      // Check if the cooldown has passed
      if (!this.lastShotTime || this.time.now - this.lastShotTime > 1000) {
        let bullet = this.physics.add.sprite(
          this.player.x,
          this.player.y,
          "bullet"
        );
        this.bullets.add(bullet);

        this.physics.moveTo(bullet, this.input.x, this.input.y, 300);

        // Set boundaries for bullets
        bullet.setCollideWorldBounds(true);

        // Optionally, set the bullet to be destroyed automatically when it leaves the world bounds
        bullet.body.onWorldBounds = true;
        bullet.body.world.on("worldbounds", (body) => {
          if (body.gameObject === bullet) {
            bullet.destroy();
          }
        });

        // Destroy the bullet after 5 seconds if not already destroyed
        this.time.delayedCall(
          5000,
          () => {
            if (bullet && bullet.active) {
              bullet.destroy();
            }
          },
          [],
          this
        );

        // Set the last shot time
        this.lastShotTime = this.time.now;

        // Add a delay for the cooldown (1 second)
        this.time.delayedCall(1000, () => {}, [], this);
      }
    }
  }

  hitAlien(bullet, alien) {
    bullet.destroy();
    alien.destroy();

    this.alien.x = Phaser.Math.Between(100, 600);
    this.alien.y = Phaser.Math.Between(100, 300);

    this.score += 10;

    this.scoreText.setText("score: " + this.score);

    this.tweens.add({
      targets: this.player,
      duration: 200,
      scaleX: 1.2,
      scaleY: 1.2,
      yoyo: true,
    });

    this.alien = this.physics.add.sprite(300, 300, "alien");
    this.alien.setCollideWorldBounds(true);
    this.alien.setBounce(1);
    this.alien.setVelocity(100, 100);
    this.alienSpeed = 100;
    this.nextAlienMove = 0;
  }

  moveAlien() {
    if (this.player && this.alien) {
      const speed = 100; // Adjust speed as necessary
      const angle = Phaser.Math.Angle.Between(
        this.alien.x,
        this.alien.y,
        this.player.x,
        this.player.y
      );
      this.alien.setVelocityX(Math.cos(angle) * speed);
      this.alien.setVelocityY(Math.sin(angle) * speed);
    }
  }

  endGame() {
    this.scene.start("LeaderboardScene");
  }

  showLeaderboard() {
    // Switch to the leaderboard scene
    this.scene.launch("LeaderboardScene");
  }

  resumeGame() {
    // Resume the game from the leaderboard
    this.scene.stop("LeaderboardScene");
    this.scene.resume();
  }

  // In your main game scene, when the game ends
  endGame() {
    this.scene.stop("mainScene");
    this.scene.start("GameOverScene", { score: this.score });
  }

  createButton(x, y, text, callback) {
    const button = this.add
      .text(x, y, text, {
        fontSize: "20px",
        padding: { x: 10, y: 5 },
        backgroundColor: "#000000",
        color: "#ffffff",
      })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => callback.call(this));

    return button;
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" });
  }

  init(data) {
    this.finalScore = data.score;
  }

  create() {
    // Game over text
    this.add
      .text(400, 100, "Game Over", { fontSize: "32px", color: "#fff" })
      .setOrigin(0.5);

    this.add
      .text(200, 80, "Score: " + this.finalScore, {
        fontSize: "24px",
        color: "#fff",
      })
      .setOrigin(0.5);

    // Create a native HTML input element for the alias
    const input = document.createElement("input");
    input.type = "text";
    input.style.position = "absolute";
    input.style.top = "350px";
    input.style.left = "400px";
    input.style.transform = "translateX(-50%)";
    document.body.appendChild(input);

    // Save button
    const saveButton = this.add
      .text(400, 400, "Save Score", { fontSize: "24px", color: "#fff" })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.saveScore(input.value));
  }

  saveScore(alias) {
    const score = this.finalScore; // Use the score passed to this scene
    const data = { alias, score };
    console.log("Sending data:", data);

    fetch("http://localhost:8080/api/leaderboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data), // Stringify the data
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Score saved:", data);
        // Handle any response here
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
}

class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: "LeaderboardScene" });
  }

  preload() {}

  create() {
    let graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 0.8);
    graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    this.add.text(100, 100, "Leaderboard", { fontSize: "32px", color: "#fff" });

    this.createCloseButton(500, 550, "Close", this.closeLeaderboard);

    this.fetchLeaderboardData();
  }

  fetchLeaderboardData() {
    fetch("http://localhost:8080/api/leaderboard")
      .then((response) => response.json())
      .then((data) => this.displayLeaderboard(data))
      .catch((error) =>
        console.error("Error fetching leaderboard data:", error)
      );
  }

  displayLeaderboard(data) {
    data.forEach((entry, index) => {
      this.add.text(100, 150 + index * 30, `${entry.alias}: ${entry.score}`, {
        fontSize: "24px",
        color: "#fff",
      });
    });
  }

  toggleVisibility(visible) {
    this.visible = visible;
  }

  createCloseButton(x, y, text, callback) {
    let button = this.add
      .text(x, y, text, {
        fontSize: "20px",
        padding: { x: 10, y: 5 },
        backgroundColor: "#000000",
        color: "#ffffff",
      })
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => callback.call(this));

    return button;
  }

  closeLeaderboard() {
    this.scene.stop();
    this.scene.resume("mainScene");
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#3498db",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [mainScene, LeaderboardScene, GameOverScene],
});
