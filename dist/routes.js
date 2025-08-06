import { getAllCars, getAllUsers, saveAllUsers, saveAllCars, getCarById, } from "./db.js";
import { setAuthCookie, parseCookies, generateToken, getUserFromToken, } from "./auth.js";
const sseClients = [];
function parseBody(req, callback) {
    let body = "";
    req.on("data", (chunk) => {
        body += chunk;
    });
    req.on("end", () => {
        callback(body);
    });
}
function sendError(res, code, message) {
    res.statusCode = code;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: message }));
}
function getUserFromRequest(req) {
    const cookies = parseCookies(req);
    const token = cookies.authToken;
    return token ? getUserFromToken(token) : null;
}
function canEditCar(user, car) {
    return user.role === "admin" || car.ownerId === user.id;
}
export async function handleRoute(req, res) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (req.method === "GET" && req.url === "/sse") {
        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        });
        res.write("\n");
        sseClients.push(res);
        req.on("close", () => {
            const idx = sseClients.indexOf(res);
            if (idx !== -1)
                sseClients.splice(idx, 1);
        });
        return;
    }
    const carIdFromUrl = (_a = req.url) === null || _a === void 0 ? void 0 : _a.match(/^\/cars\/([^\/]+)$/);
    if (req.method === "POST" && ((_b = req.url) === null || _b === void 0 ? void 0 : _b.startsWith("/register"))) {
        parseBody(req, async (body) => {
            let data;
            try {
                data = JSON.parse(body);
            }
            catch (err) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Invalid JSON" }));
                return;
            }
            let users = await getAllUsers();
            const existingUser = users.find((user) => user.username === data.username);
            if (existingUser != undefined) {
                res.statusCode = 409;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "User exists" }));
                return;
            }
            else {
                const newId = Date.now().toString();
                const newUser = {
                    id: newId,
                    username: data.username,
                    password: data.password,
                    role: "user",
                    balance: 0,
                };
                users.push(newUser);
                await saveAllUsers(users);
                res.statusCode = 201;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ message: "User registered", user: newUser }));
            }
        });
        return;
    }
    if (req.method === "POST" && ((_c = req.url) === null || _c === void 0 ? void 0 : _c.startsWith("/login"))) {
        parseBody(req, async (body) => {
            let data;
            try {
                data = JSON.parse(body);
            }
            catch (err) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Invalid JSON" }));
                return;
            }
            let users = await getAllUsers();
            const user = users.find((user) => user.username === data.username && user.password === data.password);
            if (!user) {
                res.statusCode = 401;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Invalid username or password" }));
                return;
            }
            const token = generateToken(user);
            setAuthCookie(res, token);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ message: "Login successful", user }));
            return;
        });
        return;
    }
    if (req.method === "GET" && req.url === "/users") {
        const userFromToken = getUserFromRequest(req);
        if (userFromToken && userFromToken.id) {
            const users = await getAllUsers();
            if (userFromToken.role === "admin") {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(users));
                return;
            }
            const user = users.find((u) => u.id === userFromToken.id);
            if (user) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(user));
                return;
            }
        }
        return sendError(res, 401, "Not logged in");
    }
    if (req.method === "GET" && req.url === "/cars") {
        const cars = await getAllCars();
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(cars));
    }
    if (req.method === "POST" && req.url === "/cars") {
        parseBody(req, async (body) => {
            let data;
            try {
                data = JSON.parse(body);
            }
            catch (err) {
                return sendError(res, 400, "Invalid JSON");
            }
            let cars = await getAllCars();
            const newCar = {
                id: Date.now().toString(),
                model: data.model,
                price: data.price,
                ownerId: "",
            };
            cars.push(newCar);
            await saveAllCars(cars);
            res.statusCode = 201;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ message: "Car added", car: newCar }));
            return;
        });
        return;
    }
    const matchPut = (_d = req.url) === null || _d === void 0 ? void 0 : _d.match(/^\/cars\/([^\/]+)$/);
    if (req.method === "PUT" && matchPut) {
        const carId = matchPut[1];
        const userFromToken = getUserFromRequest(req);
        if (!userFromToken)
            return sendError(res, 401, "User nie zalogowany");
        const putCar = await getCarById(carId);
        if (!putCar)
            return sendError(res, 404, "Samochód nie istnieje");
        if (!canEditCar(userFromToken, putCar))
            return sendError(res, 403, "User nie jest wlascicielem auta");
        parseBody(req, async (body) => {
            let data;
            try {
                data = JSON.parse(body);
            }
            catch (err) {
                return sendError(res, 400, "Invalid JSON");
            }
            let cars = await getAllCars();
            const carToUpdate = cars.find((car) => car.id === carId);
            if (carToUpdate) {
                carToUpdate.model = data.model;
                carToUpdate.price = data.price;
            }
            await saveAllCars(cars);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ message: "Car updated", car: carToUpdate }));
            return;
        });
        return;
    }
    //Tutaj pomoc Chatu GPT, nie wiedziałem jak dobrać się do carId
    const match = (_e = req.url) === null || _e === void 0 ? void 0 : _e.match(/^\/cars\/([^\/]+)\/buy$/);
    if (req.method === "POST" && match) {
        const carId = match[1];
        const cookies = parseCookies(req);
        const token = cookies.authToken;
        const userFromToken = token ? getUserFromToken(token) : null;
        if (!userFromToken || !userFromToken.id) {
            res.statusCode = 401;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Nie jesteś zalogowany" }));
            return;
        }
        const users = await getAllUsers();
        const cars = await getAllCars();
        const isUser = users.find((user) => user.id === userFromToken.id);
        const isCar = cars.find((car) => car.id === carId);
        if (!isCar || !isUser) {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Nie znaleziono użytkownika lub samochodu" }));
            return;
        }
        if (isCar.ownerId.length > 0) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Samochód jest już kupiony" }));
            return;
        }
        if (isCar.price > isUser.balance) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Brak kasiory" }));
            return;
        }
        isCar.ownerId = isUser.id;
        isUser.balance = isUser.balance - isCar.price;
        await saveAllCars(cars);
        await saveAllUsers(users);
        const eventData = JSON.stringify({
            event: "car_bought",
            carId: isCar.id,
            buyerId: isUser.id,
        });
        sseClients.forEach((client) => {
            client.write(`data: ${eventData}\n\n`);
        });
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ message: "Zakup udany" }));
        return;
    }
    const matchDelete = (_f = req.url) === null || _f === void 0 ? void 0 : _f.match(/^\/cars\/([^\/]+)$/);
    if (req.method === "DELETE" && matchDelete) {
        const carId = matchDelete[1];
        const userFromToken = getUserFromRequest(req);
        if (!userFromToken)
            return sendError(res, 401, "User nie zalogowany");
        const carToDelete = await getCarById(carId);
        if (!carToDelete)
            return sendError(res, 404, "Samochód nie istnieje");
        if (!canEditCar(userFromToken, carToDelete))
            return sendError(res, 403, "User nie jest wlascicielem auta");
        let cars = await getAllCars();
        cars = cars.filter((car) => car.id !== carId);
        await saveAllCars(cars);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ message: "Car deleted" }));
        return;
    }
    const matchUser = (_g = req.url) === null || _g === void 0 ? void 0 : _g.match(/^\/users\/([^\/]+)$/);
    if (req.method === "PUT" && matchUser) {
        const userId = matchUser[1];
        const userFromToken = getUserFromRequest(req);
        if (!userFromToken)
            return sendError(res, 401, "User nie zalogowany");
        let users = await getAllUsers();
        const userToUpdate = users.find((u) => u.id === userId);
        if (!userToUpdate)
            return sendError(res, 404, "User nie istnieje");
        if (userFromToken.role !== "admin" && userFromToken.id !== userId) {
            return sendError(res, 403, "Brak uprawnień do edycji tego użytkownika");
        }
        parseBody(req, async (body) => {
            let data;
            try {
                data = JSON.parse(body);
            }
            catch (err) {
                return sendError(res, 400, "Invalid JSON");
            }
            if (data.username)
                userToUpdate.username = data.username;
            if (data.password)
                userToUpdate.password = data.password;
            if (userFromToken.role === "admin" && data.role) {
                userToUpdate.role = data.role;
            }
            else
                return sendError(res, 403, "Brak uprawnień do edycji roli");
            await saveAllUsers(users);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ message: "User updated", user: userToUpdate }));
            return;
        });
        return;
    }
    if (req.method === "DELETE" && matchUser) {
        const userId = matchUser[1];
        const userFromToken = getUserFromRequest(req);
        if (!userFromToken)
            return sendError(res, 401, "User nie zalogowany");
        let users = await getAllUsers();
        const userToDelete = users.find((u) => u.id === userId);
        if (!userToDelete)
            return sendError(res, 404, "User nie istnieje");
        if (userFromToken.role !== "admin" && userFromToken.id !== userId) {
            return sendError(res, 403, "Brak uprawnień do usunięcia tego użytkownika");
        }
        users = users.filter((u) => u.id !== userId);
        await saveAllUsers(users);
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ message: "User deleted" }));
        return;
    }
    const matchFund = (_h = req.url) === null || _h === void 0 ? void 0 : _h.match(/^\/fund\/([^\/]+)$/);
    if (req.method === "POST" && matchFund) {
        const userId = matchFund[1];
        const userFromToken = getUserFromRequest(req);
        if (!userFromToken)
            return sendError(res, 401, "User nie zalogowany");
        let users = await getAllUsers();
        const userToFund = users.find((u) => u.id === userId);
        if (!userToFund)
            return sendError(res, 404, "User nie istnieje");
        if (userFromToken.role !== "admin") {
            return sendError(res, 403, "Brak uprawnień do zasilenia tego konta");
        }
        parseBody(req, async (body) => {
            let data;
            try {
                data = JSON.parse(body);
            }
            catch (err) {
                return sendError(res, 400, "Invalid JSON");
            }
            if (typeof data.amount !== "number" || data.amount <= 0) {
                return sendError(res, 400, "Nieprawidłowa kwota");
            }
            userToFund.balance += data.amount;
            await saveAllUsers(users);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ message: "Konto zasilone", user: userToFund }));
            return;
        });
        return;
    }
}
