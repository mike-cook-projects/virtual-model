var mocha = require("mocha"),
    chai = require("chai"),
    expect = chai.expect,
    Observable = require("../simplerx/observable"),
    Falcor = require("./falcor"),
    NOOP = function() {};

describe("Falcor", function() {
    let falcor,
        connection,
        APP_DATA,
        SERVER_DATA;
    beforeEach(function() {
        APP_DATA = {
            state: {
                currentMovie: ['movies', 4],
                nextMovie: ['movies', 5],
                currentActor: ['actors', 0],
                nextActor: ['actors', 1],
                currentSong: ['songs', 0],
                testObject: ['test', 0],
                testArray: ['test', 1],
                testString: ['test', 2],
                testInt: ['test', 3],
                testFloat: ['test', 4]
            },
            movies: {
                "0": { title: 'Ginsburg' },
                "1": { title: 'Ginsburg 2: The Reckoning' },
                "2": { title: 'Ginsburg 3: Unscared to Die' },
            },
            actors: {
                "0": { name: "Sam McGoo", lastMovie: ['movies', 1] }
            },
            test: {
                "0": { this: "that" },
                "1": ["that"],
                "2": "that",
                "3": 3,
                "4": 1.234
            }
        }

        connection = (function() {
            let serverFalcor = new Falcor(),
                SERVER_DATA = {
                    movies: {
                        "0": { title: 'Ginsburg' },
                        "1": { title: 'Ginsburg 2: The Reckoning' },
                        "2": { title: 'Ginsburg 3: Unscared to Die' },
                        "3": { title: 'Ginsburg 4: Uncensored' },
                        "4": { title: 'Ginsburg 5: Censored' },
                        "5": { title: 'Ginsburg 6: Full Frontal' },
                    },
                    actors: {
                        "0": { name: "Sam McGoo", lastMovie: ['movies', 1] },
                        "1": { name: "Gooply", lastMovie: ['movies', 5] }
                    },
                    songs: {
                        "0": { name: "Rural Dog Barks Vol. 2" }
                    },
                    testServer: {
                        "0": ["that"]
                    }
                };

            return function(path, handleResult) {
                setTimeout(function() {
                    let result = serverFalcor._processPath(SERVER_DATA, path);
                    handleResult(result);
                }, 100);
            }
        })()

        falcor = new Falcor({ connection });
    })
    it("Can exist", function() {
        expect(falcor.get).to.exist;
        expect(falcor.set).to.exist;
    });
    it("Can handle pointers", function(done) {
        falcor.get(APP_DATA, ['state', 'currentActor', 'lastMovie', 'title']).subscribe(function(data) {
            expect(data).to.equal('Ginsburg 2: The Reckoning');
            done();
        });
    })
    it("Can handle direct access", function(done) {
        falcor.get(APP_DATA, ['actors', 0, 'name']).subscribe(function(data) {
            expect(data).to.equal('Sam McGoo');
            done();
        });
    })
    it("Can get data from the server", function(done) {
        falcor.get(APP_DATA, ['state', 'currentMovie', 'title']).subscribe(function(data) {
            expect(data).to.equal('Ginsburg 5: Censored');
            done();
        });
    })
    it("Populates the local cache with returned data", function(done) {
        falcor.get(APP_DATA, ['state', 'currentMovie', 'title']).subscribe(function(data) {
            expect(data).to.equal("Ginsburg 5: Censored");
            expect(APP_DATA.movies[4]).to.exist;
            expect(APP_DATA.movies[4].title).to.equal("Ginsburg 5: Censored");
            done();
        });
    })
    it("Can populate complex data", function(done) {
        falcor.get(APP_DATA, ['state', 'nextActor', 'lastMovie', 'title']).subscribe(function(data) {
            expect(APP_DATA.actors[1]).to.exist;
            expect(APP_DATA.actors[1].lastMovie).to.exist;
            expect(APP_DATA.actors[1].lastMovie).to.deep.equal(['movies', 5]);
            expect(APP_DATA.movies[5]).to.exist;
            expect(APP_DATA.movies[5].title).to.equal("Ginsburg 6: Full Frontal");
            done();
        });
    })
    it("Can populate root data", function(done) {
        falcor.get(APP_DATA, ['state', 'currentSong', 'name']).subscribe(function(data) {
            expect(data).to.equal("Rural Dog Barks Vol. 2");
            expect(APP_DATA.songs).to.exist;
            expect(APP_DATA.songs[0]).to.exist;
            expect(APP_DATA.songs[0].name).to.equal("Rural Dog Barks Vol. 2");
            done();
        });
    })
    it("Can access all types except array", function(done) {
        let accessCount = 0;
        function checkProperty(property, equal, deep) {
            accessCount++;
            falcor.get(APP_DATA, ['state', property]).subscribe((data) => {
                accessCount--;
                if (deep) {
                    expect(data).to.deep.equal(equal);
                } else {
                    expect(data).to.equal(equal);
                }

                if (!accessCount) done();
            });
        }

        checkProperty('testObject', { this: "that" }, true);
        checkProperty('testString', "that");
        checkProperty('testInt', 3);
        checkProperty('testFloat', 1.234);
    })
    it("Can't access arrays as values", function(done) {
        falcor.get(APP_DATA, ['state', 'testArray']).subscribe((data) => {
            expect(data).to.equal(undefined);
            done();
        });
    })
    it("Can't access arrays as values from the server", function(done) {
        falcor.get(APP_DATA, ['testServer', 0]).subscribe((data) => {
            expect(data).to.equal(undefined);
            expect(APP_DATA.testServer).to.exist;
            expect(APP_DATA.testServer["0"]).to.equal(undefined);
            done();
        });
    })
});