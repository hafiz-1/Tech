PS D:\TechCart\frontend> npm run dev

npm notice run dev

npm notice run vite dev

The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option. You can remove the plugin and set resolve.tsconfigPaths: true in your Vite config instead.
 
  VITE v8.1.5  ready in 16634 ms
 
  ➜  Local:   http://localhost:8081/

  ➜  Network: http://172.29.25.209:8081/

  ➜  press h + enter to show help

14:57:29 [vite] (ssr) connected.

Error: aborted

    at abortIncoming (node:_http_server:897:17)

    at socketOnClose (node:_http_server:890:3)

    at Socket.emit (node:events:521:24)

    at TCP.<anonymous> (node:net:351:12) (status 500)

caused by: Error: aborted

    at abortIncoming (node:_http_server:897:17)

    at socketOnClose (node:_http_server:890:3)

    at Socket.emit (node:events:521:24)

    at TCP.<anonymous> (node:net:351:12)

Error: aborted

    at abortIncoming (node:_http_server:897:17)

    at socketOnClose (node:_http_server:890:3)

    at Socket.emit (node:events:521:24)

    at TCP.<anonymous> (node:net:351:12) (status 500)

caused by: Error: aborted

    at abortIncoming (node:_http_server:897:17)

    at socketOnClose (node:_http_server:890:3)

    at Socket.emit (node:events:521:24)

    at TCP.<anonymous> (node:net:351:12)

 :8081/:1 Access to fetch at 'http://localhost:5000/api/categories' from origin 'http://localhost:8081' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

api.ts:39  GET http://localhost:5000/api/categories net::ERR_FAILED 200 (OK)

rawFetch @ api.ts:39

(anonymous) @ api.ts:85

(anonymous) @ endpoints.ts:26

fetchFn @ @tanstack_react-query.js?v=da095df1:1912

run @ @tanstack_react-query.js?v=da095df1:1322

start @ @tanstack_react-query.js?v=da095df1:1358

fetch @ @tanstack_react-query.js?v=da095df1:1962

#executeFetch @ @tanstack_react-query.js?v=da095df1:2383

fetch @ @tanstack_react-query.js?v=da095df1:2373

refetch @ @tanstack_react-query.js?v=da095df1:2325

(anonymous) @ index.tsx:436

executeDispatch @ react-dom_client.js?v=da095df1:9904

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

processDispatchQueue @ react-dom_client.js?v=da095df1:9930

(anonymous) @ react-dom_client.js?v=da095df1:10199

batchedUpdates$1 @ react-dom_client.js?v=da095df1:2143

dispatchEventForPluginEventSystem @ react-dom_client.js?v=da095df1:10003

dispatchEvent @ react-dom_client.js?v=da095df1:12511

dispatchDiscreteEvent @ react-dom_client.js?v=da095df1:12493
<button>

exports.jsxDEV @ react_jsx-dev-runtime.js?v=da095df1:200

(anonymous) @ button.tsx:44

react_stack_bottom_frame @ react-dom_client.js?v=da095df1:14140

renderWithHooksAgain @ react-dom_client.js?v=da095df1:4455

renderWithHooks @ react-dom_client.js?v=da095df1:4404

updateForwardRef @ react-dom_client.js?v=da095df1:5595

beginWork @ react-dom_client.js?v=da095df1:6453

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

performUnitOfWork @ react-dom_client.js?v=da095df1:9146

workLoopSync @ react-dom_client.js?v=da095df1:9042

renderRootSync @ react-dom_client.js?v=da095df1:9026

performWorkOnRoot @ react-dom_client.js?v=da095df1:8676

performSyncWorkOnRoot @ react-dom_client.js?v=da095df1:9840

flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=da095df1:9757

processRootScheduleInMicrotask @ react-dom_client.js?v=da095df1:9778

(anonymous) @ react-dom_client.js?v=da095df1:9851
<Button>

exports.jsxDEV @ react_jsx-dev-runtime.js?v=da095df1:200

(anonymous) @ StatusState.tsx:30

react_stack_bottom_frame @ react-dom_client.js?v=da095df1:14140

renderWithHooksAgain @ react-dom_client.js?v=da095df1:4455

renderWithHooks @ react-dom_client.js?v=da095df1:4404

updateFunctionComponent @ react-dom_client.js?v=da095df1:5773

beginWork @ react-dom_client.js?v=da095df1:6389

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

performUnitOfWork @ react-dom_client.js?v=da095df1:9146

workLoopSync @ react-dom_client.js?v=da095df1:9042

renderRootSync @ react-dom_client.js?v=da095df1:9026

performWorkOnRoot @ react-dom_client.js?v=da095df1:8676

performSyncWorkOnRoot @ react-dom_client.js?v=da095df1:9840

flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=da095df1:9757

processRootScheduleInMicrotask @ react-dom_client.js?v=da095df1:9778

(anonymous) @ react-dom_client.js?v=da095df1:9851
<ErrorState>

exports.jsxDEV @ react_jsx-dev-runtime.js?v=da095df1:200

HomePage @ index.tsx:436

react_stack_bottom_frame @ react-dom_client.js?v=da095df1:14140

renderWithHooksAgain @ react-dom_client.js?v=da095df1:4455

renderWithHooks @ react-dom_client.js?v=da095df1:4404

updateFunctionComponent @ react-dom_client.js?v=da095df1:5773

beginWork @ react-dom_client.js?v=da095df1:6389

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

performUnitOfWork @ react-dom_client.js?v=da095df1:9146

workLoopSync @ react-dom_client.js?v=da095df1:9042

renderRootSync @ react-dom_client.js?v=da095df1:9026

performWorkOnRoot @ react-dom_client.js?v=da095df1:8676

performSyncWorkOnRoot @ react-dom_client.js?v=da095df1:9840

flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=da095df1:9757

processRootScheduleInMicrotask @ react-dom_client.js?v=da095df1:9778

(anonymous) @ react-dom_client.js?v=da095df1:9851
<HomePage>

exports.createElement @ react.js?v=da095df1:640

Lazy @ lazyRouteComponent.js?v=da095df1:49

react_stack_bottom_frame @ react-dom_client.js?v=da095df1:14140

renderWithHooksAgain @ react-dom_client.js?v=da095df1:4455

renderWithHooks @ react-dom_client.js?v=da095df1:4404

updateFunctionComponent @ react-dom_client.js?v=da095df1:5773

beginWork @ react-dom_client.js?v=da095df1:6389

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

performUnitOfWork @ react-dom_client.js?v=da095df1:9146

workLoopSync @ react-dom_client.js?v=da095df1:9042

renderRootSync @ react-dom_client.js?v=da095df1:9026

performWorkOnRoot @ react-dom_client.js?v=da095df1:8676

performSyncWorkOnRoot @ react-dom_client.js?v=da095df1:9840

flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=da095df1:9757

processRootScheduleInMicrotask @ react-dom_client.js?v=da095df1:9778

(anonymous) @ react-dom_client.js?v=da095df1:9851
<Lazy>

exports.jsx @ react_jsx-runtime.js?v=da095df1:200

(anonymous) @ Match.js?v=da095df1:103

updateMemo @ react-dom_client.js?v=da095df1:5138

useMemo @ react-dom_client.js?v=da095df1:14547

exports.useMemo @ react.js?v=da095df1:757

MatchInnerImpl @ Match.js?v=da095df1:101

react_stack_bottom_frame @ react-dom_client.js?v=da095df1:14140

renderWithHooks @ react-dom_client.js?v=da095df1:4398

updateFunctionComponent @ react-dom_client.js?v=da095df1:5773

updateSimpleMemoComponent @ react-dom_client.js?v=da095df1:5631

beginWork @ react-dom_client.js?v=da095df1:6460

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

performUnitOfWork @ react-dom_client.js?v=da095df1:9146

workLoopSync @ react-dom_client.js?v=da095df1:9042

renderRootSync @ react-dom_client.js?v=da095df1:9026

performWorkOnRoot @ react-dom_client.js?v=da095df1:8676

performSyncWorkOnRoot @ react-dom_client.js?v=da095df1:9840

flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=da095df1:9757

processRootScheduleInMicrotask @ react-dom_client.js?v=da095df1:9778

(anonymous) @ react-dom_client.js?v=da095df1:9851

:8081/:1 Access to fetch at 'http://localhost:5000/api/categories' from origin 'http://localhost:8081' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

api.ts:39  GET http://localhost:5000/api/categories net::ERR_FAILED 200 (OK)

rawFetch @ api.ts:39

(anonymous) @ api.ts:85

(anonymous) @ endpoints.ts:26

fetchFn @ @tanstack_react-query.js?v=da095df1:1912

run @ @tanstack_react-query.js?v=da095df1:1322

(anonymous) @ @tanstack_react-query.js?v=da095df1:1342

Promise.then

(anonymous) @ @tanstack_react-query.js?v=da095df1:1340

Promise.catch

run @ @tanstack_react-query.js?v=da095df1:1326

start @ @tanstack_react-query.js?v=da095df1:1358

fetch @ @tanstack_react-query.js?v=da095df1:1962

#executeFetch @ @tanstack_react-query.js?v=da095df1:2383

fetch @ @tanstack_react-query.js?v=da095df1:2373

refetch @ @tanstack_react-query.js?v=da095df1:2325

(anonymous) @ index.tsx:436

executeDispatch @ react-dom_client.js?v=da095df1:9904

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

processDispatchQueue @ react-dom_client.js?v=da095df1:9930

(anonymous) @ react-dom_client.js?v=da095df1:10199

batchedUpdates$1 @ react-dom_client.js?v=da095df1:2143

dispatchEventForPluginEventSystem @ react-dom_client.js?v=da095df1:10003

dispatchEvent @ react-dom_client.js?v=da095df1:12511

dispatchDiscreteEvent @ react-dom_client.js?v=da095df1:12493
<button>

exports.jsxDEV @ react_jsx-dev-runtime.js?v=da095df1:200

(anonymous) @ button.tsx:44

react_stack_bottom_frame @ react-dom_client.js?v=da095df1:14140

renderWithHooksAgain @ react-dom_client.js?v=da095df1:4455

renderWithHooks @ react-dom_client.js?v=da095df1:4404

updateForwardRef @ react-dom_client.js?v=da095df1:5595

beginWork @ react-dom_client.js?v=da095df1:6453

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

performUnitOfWork @ react-dom_client.js?v=da095df1:9146

workLoopSync @ react-dom_client.js?v=da095df1:9042

renderRootSync @ react-dom_client.js?v=da095df1:9026

performWorkOnRoot @ react-dom_client.js?v=da095df1:8676

performSyncWorkOnRoot @ react-dom_client.js?v=da095df1:9840

flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=da095df1:9757

processRootScheduleInMicrotask @ react-dom_client.js?v=da095df1:9778

(anonymous) @ react-dom_client.js?v=da095df1:9851
<Button>

exports.jsxDEV @ react_jsx-dev-runtime.js?v=da095df1:200

(anonymous) @ StatusState.tsx:30

react_stack_bottom_frame @ react-dom_client.js?v=da095df1:14140

renderWithHooksAgain @ react-dom_client.js?v=da095df1:4455

renderWithHooks @ react-dom_client.js?v=da095df1:4404

updateFunctionComponent @ react-dom_client.js?v=da095df1:5773

beginWork @ react-dom_client.js?v=da095df1:6389

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

performUnitOfWork @ react-dom_client.js?v=da095df1:9146

workLoopSync @ react-dom_client.js?v=da095df1:9042

renderRootSync @ react-dom_client.js?v=da095df1:9026

performWorkOnRoot @ react-dom_client.js?v=da095df1:8676

performSyncWorkOnRoot @ react-dom_client.js?v=da095df1:9840

flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=da095df1:9757

processRootScheduleInMicrotask @ react-dom_client.js?v=da095df1:9778

(anonymous) @ react-dom_client.js?v=da095df1:9851
<ErrorState>

exports.jsxDEV @ react_jsx-dev-runtime.js?v=da095df1:200

HomePage @ index.tsx:436

react_stack_bottom_frame @ react-dom_client.js?v=da095df1:14140

renderWithHooksAgain @ react-dom_client.js?v=da095df1:4455

renderWithHooks @ react-dom_client.js?v=da095df1:4404

updateFunctionComponent @ react-dom_client.js?v=da095df1:5773

beginWork @ react-dom_client.js?v=da095df1:6389

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

performUnitOfWork @ react-dom_client.js?v=da095df1:9146

workLoopSync @ react-dom_client.js?v=da095df1:9042

renderRootSync @ react-dom_client.js?v=da095df1:9026

performWorkOnRoot @ react-dom_client.js?v=da095df1:8676

performSyncWorkOnRoot @ react-dom_client.js?v=da095df1:9840

flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=da095df1:9757

processRootScheduleInMicrotask @ react-dom_client.js?v=da095df1:9778

(anonymous) @ react-dom_client.js?v=da095df1:9851
<HomePage>

exports.createElement @ react.js?v=da095df1:640

Lazy @ lazyRouteComponent.js?v=da095df1:49

react_stack_bottom_frame @ react-dom_client.js?v=da095df1:14140

renderWithHooksAgain @ react-dom_client.js?v=da095df1:4455

renderWithHooks @ react-dom_client.js?v=da095df1:4404

updateFunctionComponent @ react-dom_client.js?v=da095df1:5773

beginWork @ react-dom_client.js?v=da095df1:6389

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

performUnitOfWork @ react-dom_client.js?v=da095df1:9146

workLoopSync @ react-dom_client.js?v=da095df1:9042

renderRootSync @ react-dom_client.js?v=da095df1:9026

performWorkOnRoot @ react-dom_client.js?v=da095df1:8676

performSyncWorkOnRoot @ react-dom_client.js?v=da095df1:9840

flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=da095df1:9757

processRootScheduleInMicrotask @ react-dom_client.js?v=da095df1:9778

(anonymous) @ react-dom_client.js?v=da095df1:9851
<Lazy>

exports.jsx @ react_jsx-runtime.js?v=da095df1:200

(anonymous) @ Match.js?v=da095df1:103

updateMemo @ react-dom_client.js?v=da095df1:5138

useMemo @ react-dom_client.js?v=da095df1:14547

exports.useMemo @ react.js?v=da095df1:757

MatchInnerImpl @ Match.js?v=da095df1:101

react_stack_bottom_frame @ react-dom_client.js?v=da095df1:14140

renderWithHooks @ react-dom_client.js?v=da095df1:4398

updateFunctionComponent @ react-dom_client.js?v=da095df1:5773

updateSimpleMemoComponent @ react-dom_client.js?v=da095df1:5631

beginWork @ react-dom_client.js?v=da095df1:6460

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

performUnitOfWork @ react-dom_client.js?v=da095df1:9146

workLoopSync @ react-dom_client.js?v=da095df1:9042

renderRootSync @ react-dom_client.js?v=da095df1:9026

performWorkOnRoot @ react-dom_client.js?v=da095df1:8676

performSyncWorkOnRoot @ react-dom_client.js?v=da095df1:9840

flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=da095df1:9757

processRootScheduleInMicrotask @ react-dom_client.js?v=da095df1:9778

(anonymous) @ react-dom_client.js?v=da095df1:9851

:8081/:1 Access to fetch at 'http://localhost:5000/api/categories' from origin 'http://localhost:8081' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

api.ts:39  GET http://localhost:5000/api/categories net::ERR_FAILED 200 (OK)

rawFetch @ api.ts:39

(anonymous) @ api.ts:85

(anonymous) @ endpoints.ts:26

fetchFn @ @tanstack_react-query.js?v=da095df1:1912

run @ @tanstack_react-query.js?v=da095df1:1322

(anonymous) @ @tanstack_react-query.js?v=da095df1:1342

Promise.then

(anonymous) @ @tanstack_react-query.js?v=da095df1:1340

Promise.catch

run @ @tanstack_react-query.js?v=da095df1:1326

(anonymous) @ @tanstack_react-query.js?v=da095df1:1342

Promise.then

(anonymous) @ @tanstack_react-query.js?v=da095df1:1340

Promise.catch

run @ @tanstack_react-query.js?v=da095df1:1326

start @ @tanstack_react-query.js?v=da095df1:1358

fetch @ @tanstack_react-query.js?v=da095df1:1962

#executeFetch @ @tanstack_react-query.js?v=da095df1:2383

fetch @ @tanstack_react-query.js?v=da095df1:2373

refetch @ @tanstack_react-query.js?v=da095df1:2325

(anonymous) @ index.tsx:436

executeDispatch @ react-dom_client.js?v=da095df1:9904

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

processDispatchQueue @ react-dom_client.js?v=da095df1:9930

(anonymous) @ react-dom_client.js?v=da095df1:10199

batchedUpdates$1 @ react-dom_client.js?v=da095df1:2143

dispatchEventForPluginEventSystem @ react-dom_client.js?v=da095df1:10003

dispatchEvent @ react-dom_client.js?v=da095df1:12511

dispatchDiscreteEvent @ react-dom_client.js?v=da095df1:12493
<button>

exports.jsxDEV @ react_jsx-dev-runtime.js?v=da095df1:200

(anonymous) @ button.tsx:44

react_stack_bottom_frame @ react-dom_client.js?v=da095df1:14140

renderWithHooksAgain @ react-dom_client.js?v=da095df1:4455

renderWithHooks @ react-dom_client.js?v=da095df1:4404

updateForwardRef @ react-dom_client.js?v=da095df1:5595

beginWork @ react-dom_client.js?v=da095df1:6453

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

performUnitOfWork @ react-dom_client.js?v=da095df1:9146

workLoopSync @ react-dom_client.js?v=da095df1:9042

renderRootSync @ react-dom_client.js?v=da095df1:9026

performWorkOnRoot @ react-dom_client.js?v=da095df1:8676

performSyncWorkOnRoot @ react-dom_client.js?v=da095df1:9840

flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=da095df1:9757

processRootScheduleInMicrotask @ react-dom_client.js?v=da095df1:9778

(anonymous) @ react-dom_client.js?v=da095df1:9851
<Button>

exports.jsxDEV @ react_jsx-dev-runtime.js?v=da095df1:200

(anonymous) @ StatusState.tsx:30

react_stack_bottom_frame @ react-dom_client.js?v=da095df1:14140

renderWithHooksAgain @ react-dom_client.js?v=da095df1:4455

renderWithHooks @ react-dom_client.js?v=da095df1:4404

updateFunctionComponent @ react-dom_client.js?v=da095df1:5773

beginWork @ react-dom_client.js?v=da095df1:6389

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

performUnitOfWork @ react-dom_client.js?v=da095df1:9146

workLoopSync @ react-dom_client.js?v=da095df1:9042

renderRootSync @ react-dom_client.js?v=da095df1:9026

performWorkOnRoot @ react-dom_client.js?v=da095df1:8676

performSyncWorkOnRoot @ react-dom_client.js?v=da095df1:9840

flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=da095df1:9757

processRootScheduleInMicrotask @ react-dom_client.js?v=da095df1:9778

(anonymous) @ react-dom_client.js?v=da095df1:9851
<ErrorState>

exports.jsxDEV @ react_jsx-dev-runtime.js?v=da095df1:200

HomePage @ index.tsx:436

react_stack_bottom_frame @ react-dom_client.js?v=da095df1:14140

renderWithHooksAgain @ react-dom_client.js?v=da095df1:4455

renderWithHooks @ react-dom_client.js?v=da095df1:4404

updateFunctionComponent @ react-dom_client.js?v=da095df1:5773

beginWork @ react-dom_client.js?v=da095df1:6389

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

performUnitOfWork @ react-dom_client.js?v=da095df1:9146

workLoopSync @ react-dom_client.js?v=da095df1:9042

renderRootSync @ react-dom_client.js?v=da095df1:9026

performWorkOnRoot @ react-dom_client.js?v=da095df1:8676

performSyncWorkOnRoot @ react-dom_client.js?v=da095df1:9840

flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=da095df1:9757

processRootScheduleInMicrotask @ react-dom_client.js?v=da095df1:9778

(anonymous) @ react-dom_client.js?v=da095df1:9851
<HomePage>

exports.createElement @ react.js?v=da095df1:640

Lazy @ lazyRouteComponent.js?v=da095df1:49

react_stack_bottom_frame @ react-dom_client.js?v=da095df1:14140

renderWithHooksAgain @ react-dom_client.js?v=da095df1:4455

renderWithHooks @ react-dom_client.js?v=da095df1:4404

updateFunctionComponent @ react-dom_client.js?v=da095df1:5773

beginWork @ react-dom_client.js?v=da095df1:6389

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

performUnitOfWork @ react-dom_client.js?v=da095df1:9146

workLoopSync @ react-dom_client.js?v=da095df1:9042

renderRootSync @ react-dom_client.js?v=da095df1:9026

performWorkOnRoot @ react-dom_client.js?v=da095df1:8676

performSyncWorkOnRoot @ react-dom_client.js?v=da095df1:9840

flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=da095df1:9757

processRootScheduleInMicrotask @ react-dom_client.js?v=da095df1:9778

(anonymous) @ react-dom_client.js?v=da095df1:9851
<Lazy>

exports.jsx @ react_jsx-runtime.js?v=da095df1:200

(anonymous) @ Match.js?v=da095df1:103

updateMemo @ react-dom_client.js?v=da095df1:5138

useMemo @ react-dom_client.js?v=da095df1:14547

exports.useMemo @ react.js?v=da095df1:757

MatchInnerImpl @ Match.js?v=da095df1:101

react_stack_bottom_frame @ react-dom_client.js?v=da095df1:14140

renderWithHooks @ react-dom_client.js?v=da095df1:4398

updateFunctionComponent @ react-dom_client.js?v=da095df1:5773

updateSimpleMemoComponent @ react-dom_client.js?v=da095df1:5631

beginWork @ react-dom_client.js?v=da095df1:6460

runWithFiberInDEV @ react-dom_client.js?v=da095df1:943

performUnitOfWork @ react-dom_client.js?v=da095df1:9146

workLoopSync @ react-dom_client.js?v=da095df1:9042

renderRootSync @ react-dom_client.js?v=da095df1:9026

performWorkOnRoot @ react-dom_client.js?v=da095df1:8676

performSyncWorkOnRoot @ react-dom_client.js?v=da095df1:9840

flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=da095df1:9757

processRootScheduleInMicrotask @ react-dom_client.js?v=da095df1:9778

(anonymous) @ react-dom_client.js?v=da095df1:9851

 D:\ATEEQ MERN PORTFOLIO\Tech-umair-project\backend