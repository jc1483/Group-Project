/*jslint plusplus: true, white: true */
/*global canvas, transform,
        console, document, requestAnimationFrame, Sphere */
/* @author Joshua Conrady */

//Initialize colors to use later
var BLACK  = [0, 0, 0],     WHITE = [1, 1, 1],
RED = [0.8, 0, 0],          OFFWHITE = [0.933, 0.933, 0.933],
GREY = [0.8, 0.8, 0.8],     BROWN = [1, 0.5, 0.16],
BOARD_RED = [0.6, 0, 0],     BOARD_BLACK = [0.1, 0.1, 0.1],
BLUE = [0, 0.75, 1],

SQUARE_VERTICES = [
        -0.5, 0, -0.5,
         0.5, 0, -0.5,
        -0.5, 0, 0.5,
         0.5, 0, 0.5 ],

SQUARE_NORMALS = [
        0,  1,  0,
        0,  1,  0,
        0,  1,  0,
        0,  1,  0 ],

BOARD_VERTICES = [
        -8.225, 0, -8.225,
         8.225, 0, -8.225,
        -8.225, 0,  8.225,
         8.225, 0,  8.225,
        -8.225, -0.5, -8.225,
         8.225, -0.5, -8.225,
        -8.225, -0.5,  8.225,
         8.225, -0.5,  8.225 ],

BOARD_NORMALS = [
        0,  1,  0,
        0,  1,  0,
        0,  1,  0,
        0,  1,  0,
        0, -1,  0,
        0, -1,  0,
        0, -1,  0,
        0, -1,  0 ],
  cv, main;


main = function () {
    "use strict";

    var pm, mvm, boardVertexBuffer, boardNormalBuffer,
            frame = 0, sphere, vertices, numVertices,
            normals, squareVertexBuffer, squareNormalBuffer,
            Checkers, game, sphereNormalBuffer, sphereVertexBuffer,
            clickLine, mouseDown, lastClick = [];

    // set up canvas and shaders
    cv = canvas("canvas", GREY);
    cv.setupShaders("shader.vert", "shader.frag", "pMatrix",
            "mvMatrix", "position", "color", "normal",
            "nmMatrix", "lightPosition");

    // Create a sphere mesh
    sphere = new Sphere();
    sphere.createPiece();  // recommend 1 - 5 roundness parameter
                                // Usable roundnesses: 0 - 7

    // Add an effect / texture to the piece. Possibilities listed below:
    // STARS, DARKBALL, DARKSTARS, CHECKERFADE, GOLF
    // sphere.addTexture("STARS");

    // Pass data to buffers
    vertices = sphere.getVertexMesh();
    numVertices = vertices.length / 3;
    normals = sphere.getNormals();
    boardVertexBuffer = cv.copyVertexDataToBuffer(BOARD_VERTICES);
    squareVertexBuffer = cv.copyVertexDataToBuffer(SQUARE_VERTICES);
    boardNormalBuffer = cv.copyVertexDataToBuffer(BOARD_NORMALS);
    squareNormalBuffer = cv.copyVertexDataToBuffer(SQUARE_NORMALS);
    sphereVertexBuffer = cv.copyVertexDataToBuffer(vertices);
    sphereNormalBuffer = cv.copyVertexDataToBuffer(normals);


    // Initialize transform with perspective normalization
    // and viewing transformations.
    pm = transform();
    pm.perspectiveNormalization(6, 6, 10, 30);
    // pm.perspectiveNormalization(2, 2, 10, 30);
    pm.translate(0, 1, -20);
    pm.rotateX(50);
    pm.rotateY(180);
    cv.setPMatrix(pm);

    mvm = transform();
    cv.setMvMatrix(mvm);
    cv.setLightPosition(5, 20, 5);

    Checkers = function () {
        var pb = [], pv = [];

        // 1 for Red, -1 for white
        pv.gameBoard = [ 0,  1,  0,  1,  0,  1,  0,  1,
                         1,  0,  1,  0,  1,  0,  1,  0,
                         0,  1,  0,  1,  0,  1,  0,  1,
                         0,  0,  0,  0,  0,  0,  0,  0,
                         0,  0,  0,  0,  0,  0,  0,  0,
                        -1,  0, -1,  0, -1,  0, -1,  0,
                         0, -1,  0, -1,  0, -1,  0, -1,
                        -1,  0, -1,  0, -1,  0, -1,  0 ];


        pv.player = "RED";
        pv.winner = "none";

        // Check to see if a piece can make a possible move. If it cannot,
        // space[] = false. If it can, space[] = true.
        //  piece   -   the piece to be moved
        //  player  -   the active player
        pv.checkClickable = function (piece, player, space) {
            var column, posR1Check, posL1Check, posR2Check, posL2Check,
                    negR1Check, negL1Check, negR2Check, negL2Check, color,
                    posR1, negR1, posL1, negL1, posR2, negR2, posL2, negL2;

            if (player === "RED") {
                color = 1;
            } else {
                color = -1;
            }

            column = piece % 8;

            // Set all checks to fals initially
            posR1Check = false;
            posL1Check = false;
            posR2Check = false;
            posL2Check = false;
            negR1Check = false;
            negL1Check = false;
            negR2Check = false;
            negL2Check = false;

            // Check to see if there is a piece diagonally up and left of the
            // current active piece
            if (piece + 7 <= 63)  {
                posL1Check = true;
                posL1 = pv.gameBoard[piece + 7];
            }
            // Check down left
            if (piece - 9 >= 0) {
                negL1Check = true;
                negL1 = pv.gameBoard[piece - 9];
            }
            // check up right
            if (piece + 9 <= 63)  {
                posR1Check = true;
                posR1 = pv.gameBoard[piece + 9];
            }
            // check down right
            if (piece - 7 >= 0) {
                negR1Check = true;
                negR1 = pv.gameBoard[piece - 7];
            }
            //Check to see if there is a spot two places up and two spaces left
            // of the current active piece (for jump moves)
            if (piece + 14 <= 63) {
                posL2Check = true;
                posL2 = pv.gameBoard[piece + 14];
            }
            // check two down, two left
            if (piece - 18 >= 0) {
                negL2Check = true;
                negL2 = pv.gameBoard[piece -18];
            }
            // check two up, two right
            if (piece + 18 <= 63) {
                posR2Check = true;
                posR2 = pv.gameBoard[piece + 18];
            }
            // check two down, two right
            if (piece - 14 >= 0) {
                negR2Check = true;
                negR2 = pv.gameBoard[piece - 14];
            }

            // Check possible "RED" player moves (negative)
            if (pv.gameBoard[piece] === color && player === "RED") {

                // When in the column all the way on the left, there is no,
                // left squares. Checking left, would lead to faulty display
                // of possible moves
                if (column === 0) {

                    // Check to see if first right is open
                    if (posR1Check && posR1 === 0) {
                        space[0] = posR1;       // If there is no piece, space[] = true
                    }

                    // Check second right
                    if (posR2Check && posR2 === 0 && posR1 !== color) {
                        space[1] = posR2;    // If there is no piece, and the right
                                        // one piece is of the opposite color,
                                        // space[] = true (jump move)
                    }

                // If we are in the second column from the left, there
                // are no spaces two columns to the left, checking for
                // moves in those spots, would lead to faulty display
                // of possible moves
                } else if (column === 1) {

                    // Check to see if first left is open
                    if (posL1Check && posL1 === 0) {
                        space[0] = posL1;    // If it's open, space[] = true
                    }

                    // Check to see if first right is open
                    if (posR1Check && posR1 === 0) {
                        space[1] = posR1;    //If it's open, space[] = true
                    }

                    // Check to see if second right is open
                    if (posR2Check && posR2 === 0 && posR1 !== color) {
                        space[2] = posR2;    // If it is, and the piece in first
                                        // right is of the opposite color,
                                        // space[] = true (jump move)
                    }

                    // Continue checking possible moves similar to How
                    // we've done above
                } else if (column === 7) {

                    if (posL1Check && posL1 === 0) {
                        space[0] = posL1;
                    }

                    if (posL2Check && posL2 === 0 && posL1 !== color) {
                        space[1] = posL2;
                    }

                } else if (column === 6) {
                    if (posL1Check && posL1 === 0) {
                        space[0] = posL1;
                    }

                    if (posL2Check && posL2 === 0 && posL1 !== color) {
                        space[1] =  posL2;
                    }

                    if (posR1Check && posR1 === 0) {
                        space[2] = posR1;
                    }

                } else {

                    if (posL1Check && posL1 === 0) {
                        space[0] = posL1;
                    }

                    if (posL2Check && posL2 === 0 && posL1 !== color) {
                        space[1] = posL2;
                    }

                    if (posR1Check && posR1 === 0) {
                        space[2] = posR1;
                    }

                    if (posR2Check && posR2 === 0 && posR1 !== color) {
                        space[3] = posR2;
                    }
                }

            } else if (pv.gameBoard[piece] === color && player === "WHITE") {
                // See above documentation if the logic seems confusing

                if (column === 0) {

                    if (negR1Check && negR1 === 0) {
                        space[0] = negR1;

                    }

                    if (negR2Check && negR2 === 0 && negR1 !== color) {
                        space[1] = negR2;
                    }

                } else if (column === 1) {

                    if (negL1Check && negL1 === 0) {
                        space[0] = negL1;
                    }

                    if (negR1Check && negR1 === 0) {
                        space[1] = negR1;
                    }

                    if (negR2Check && negR2 === 0 && negR1 !== color) {
                        space[2] = negR2;
                    }

                } else if (column === 7) {

                    if (negL1Check && negL1 === 0) {
                        space[0] = negL1;
                    }

                    if (negL2Check && negL2 === 0 && negL1 !== color) {
                        space[1] = negL2;
                    }

                } else if (column === 6) {

                    if (negL1Check && negL1 === 0) {
                        space[0] = negL1;
                    }

                    if (negL2Check && negL2 === 0 && negL1 !== color) {
                        space[1] = negL2;
                    }

                    if (negR1heck && negR1 === 0) {
                        space[2] = negR1;
                    }

                } else {

                    if (negL1Check && negL1 === 0) {
                        space[0] = negL1;
                    }

                    if (negL2Check && negL2 === 0 && negL1 !== color) {
                        space[1] = negL2;
                    }

                    if (negR1Check && negR1 === 0) {
                        space[2] = negR1;
                    }

                    if (negR2Check && negR2 === 0 && negR1 !== color) {
                        space[3] = negR2;
                    }
                }
            }
            if (space[0] !== "undefined") {
                return true;
            }
            return false;
        };


        // Takes a turn based on if the player is "RED" or "WHITE".
        // Marks pieces and spaces of possible moves
        //  player  -   the active player (RED or WHITE)
        pb.takeTurn = function (thisClick) {
            var squareSelect, row, column, i, rCoords = [], cCoords = [];

            // Set up coordinates of squares for easy use in loops
            for (i = 0; i < 8; i += 1) {
                rCoords.push(-7 + i * 2);
                cCoords.push(-7 + i * 2);
            }

            // draw board
            pv.drawBoard();

            for (i = 0; i < 64; i++) {
                row = i % 8;
                column = Math.floor(i / 8);
                if (pv.checkClickable(i, pv.player)) {
                    pv.drawClickable([rCoords[row], cCoords[column]]);
                }
            }


            if (pv.activePiece === -1) {
                // Get the row and column of the clicked square
                column = -Math.floor((thisClick[0] - 5.5) / (14.7 / 8));
                row = -Math.floor((thisClick[1] - 4.2) / (14.7/ 8));
                squareSelect = column + (8 * row);
                console.log(squareSelect);
                lastClick.pop();
            }
        };

        // Draw the brown gameboard from vertices
        pv.drawBoard = function () {
            cv.clear();
            cv.setMvMatrix(mvm);
            cv.setColor(BROWN);
            cv.drawFromBuffers(boardVertexBuffer, boardNormalBuffer, 0, 8);
            pv.drawSquares();
        };

        // draw the Black and Red squares for the gameboard
        pv.drawSquares = function () {
            var i, coords = [], colors = [];

            // Add square colors to an array so that we can easily switch
            // Between them with a loop... Similar with coordinates.
            colors.push(BOARD_RED);
            colors.push(BOARD_BLACK);
            for (i = 0; i < 8; i += 1) {
                coords.push(-7 + i * 2);
            }

            // Run through each of the 64 gameboard squares, drawing them
            // individually
            for (i = 0; i < 64; i++) {
                mvm.push();
                // Initial translation based on column (i % 8) and
                // row (Math.floor(i / 8))
                mvm.translate(coords[i % 8], 0.05, coords[Math.floor(i / 8)]);
                // Scale to fit the board
                mvm.scale(2);
                cv.setMvMatrix(mvm);

                // Depending on row, switch order of colors
                if (i % 8 === i % 16) {
                    cv.setColor(colors[i % 2]);
                } else {
                    cv.setColor(colors[(i + 1) % 2]);
                }
                cv.drawFromBuffers(squareVertexBuffer, squareNormalBuffer, 0, 4);
                mvm.pop();
            }

            pv.drawPieces();
        };

        pv.spinBoard = function () {
            mvm.rotateY(2);
            cv.setMvMatrix(mvm);
            pv.drawBoard();

            frame += 1;
            if (frame % 90 === 0) {
                frame = 0;
            } else {
                requestAnimationFrame(pv.spinBoard);
            }
        };

        pv.drawPieces = function () {
            var i, coords = [];

            for (i = 0; i < 8; i += 1) {
                coords.push(-7 + i * 2);
            }

            // Run through each of the 64 gameboard squares, drawing pieces
            // individually, where they need to be on the board
            for (i = 0; i < 64; i++) {
                if (pv.gameBoard[i] === -1) {
                    mvm.push();
                    // Initial translation based on column (i % 8) and
                    // row (Math.floor(i / 8))
                    mvm.translate(coords[i % 8], 0.15, coords[Math.floor(i / 8)]);
                    // Scale to fit the board
                    mvm.scale(0.5);
                    cv.setMvMatrix(mvm);

                    cv.setColor(WHITE);
                    cv.drawFromBuffers(
                            sphereVertexBuffer, sphereNormalBuffer, 0, numVertices);
                    mvm.pop();

                } else if (pv.gameBoard[i] === 1) {
                    mvm.push();
                    // Initial translation based on column (i % 8) and
                    // row (Math.floor(i / 8))
                    mvm.translate(coords[i % 8], 0.15, coords[Math.floor(i / 8)]);
                    // Scale to fit the board
                    mvm.scale(0.5);
                    cv.setMvMatrix(mvm);

                    cv.setColor(RED);
                    cv.drawFromBuffers(
                            sphereVertexBuffer, sphereNormalBuffer, 0, numVertices);
                    mvm.pop();
                }
            }
        };

        // draw an overlay on the pieces that the current player can select
        pv.drawClickable = function (coords) {
            mvm.push();
            mvm.translate(coords[0], 0.15, coords[1]);
            mvm.scale(0.51);
            cv.setMvMatrix(mvm);
            cv.setColor(BLUE);
            cv.drawFromBuffers(sphereVertexBuffer, sphereNormalBuffer, 0, numVertices);
            mvm.pop();
        };

        // Draw an overlay on the spaces to which the selected piece can move
        pv.drawMovable = function (coords) {
            var movableSpace = [], i;

            for (i = 0; i < 64; i++) {
                checkClickable(i, pv.player, movableSpace)
            }

            mvm.push();
            mvm.translate(coords[0], 0.05, coords[1]);
            mvm.scale(2.01);
            cv.setMvMatrix(mvm);
            cv.setColor(BLUE);
            cv.drawFromBuffers(
                    squareVertexBuffer, squareNormalBuffer, 0, 4);
            mvm.pop();
        };

        pb.playGame = function () {
            pv.drawBoard();
        };

        space[] = pb;
    };

    // e - Mouse event object from onmousedown or onmouseup.
    //
    // space[] =s line through 3D scene corresponding to 2D mouse
    // coordinates (as array containing two 3-element arrays:
    // the first has the x, y, z coords of the point on the
    // near plane, the second has the coords of the point on
    // the far plane).
    clickLine = function (e) {
        var c, x, y, inv, f, b;

        c = document.getElementById("canvas");
        x = e.pageX - c.offsetLeft - 1;
        y = e.pageY - c.offsetTop - 1;

        // Pixel coords to CVV coords.
        x = x * 2 / c.width - 1;
        y = -(y * 2 / c.height - 1);

        inv = pm.inverse();
        f = inv.applyTo([x, y, -1, 1]);
        b = inv.applyTo([x, y, 1, 1]);

        space[] = [f, b];
    };

    // e - Mouse event object.
    mouseDown = function (e) {
        var fb, fx, fy, fz, bx, by, bz, u, x, z;

        fb = clickLine(e);
        fx = fb[0][0]; fy = fb[0][1]; fz = fb[0][2];
        bx = fb[1][0]; by = fb[1][1]; bz = fb[1][2];

        u = (1.5 - fy) / (by - fy);
        x = u * (bx - fx) + fx;
        z = u * (bz - fz) + fz;

        lastClick.push([x.toFixed(2), z.toFixed(2)]);
        console.log(lastClick[lastClick.length - 1]);
        game.takeTurn(lastClick[lastClick.length - 1]);
    };

    //setup user input
    document.onmousedown = mouseDown;

    game = new Checkers();
    game.playGame();


};
