# README.md

FacnyTracker is a Manifest V3-compatible iteration of the original [postMessage-tracker](https://github.com/fransr/postMessage-tracker) browser extension by [Frans Rosén](https://twitter.com/fransrosen) for monitoring `postMessage` listeners in web pages.

---

# Red Team Operations Manual

## 1.0 Threat Briefing

Operation Chimera is an ongoing red team engagement against a mature web application target. Initial reconnaissance has confirmed the presence of multiple layers of defense, including a robust Content Security Policy (CSP), client-side analytics correlation, and modern browser-native security features (`SameSite` cookies).

The blue team has demonstrated the ability to detect and mitigate simple client-side attacks. Our operational posture must therefore escalate from direct manipulation to chained-exploit scenarios.

This manual details the current intelligence summary and outlines the primary attack vectors to be prosecuted in the next phase of the engagement. All operators are to familiarize themselves with these protocols.

---

## 2.0 Intelligence Summary

### 2.1 Target Infrastructure
*   **Edge:** Cloudflare (provides WAF, DDoS mitigation, and caching).
*   **Load Balancer:** AWS Application Load Balancer (inferred from `alb_` headers).
*   **Backend:** ExpressJS (inferred from `x-powered-by` header).
*   **Authentication:** Google Firebase (`securetoken.googleapis.com` endpoint). Session management is handled via a `_token` JWT cookie.
*   **Analytics:** A proprietary "meerkat-reporter" service hosted at `data.hailuoai.video`, used for client-side event correlation.

### 2.2 Red Team Toolkit
*   **`HailuoKit` (Userscript v9.4.0-RT):** Primary tool for in-flight modification of API requests. Neutralizes client-side parameter validation and server-side analytics correlation for parameter manipulation exploits.
*   **`FancyTracker` (Extension v1.2.0):** Primary tool for passive reconnaissance and active exploitation of `postMessage` listeners. Provides full visibility into cross-origin and intra-origin messaging.
*   **`ufw.sh` (Hardening Utility):** Ensures operator OPSEC by enforcing a system-level VPN kill switch and network hardening.

### 2.3 Observed Defenses & Countermeasures
1.  **Server-Side Validation:** Initial attempts to modify `FormData` payloads resulted in `400 Bad Request` errors, confirming the backend validates the structure of incoming requests. (Bypassed in HailuoKit v9.3.0).
2.  **Analytics Correlation:** The backend correlates primary API calls with out-of-band analytics events to detect client-side tampering. (Bypassed in HailuoKit v9.4.0).
3.  **Content Security Policy (CSP):** A strong CSP is delivered via HTTP headers, preventing inline script execution and limiting resource loading.
4.  **`SameSite` Cookies:** The primary `_token` session cookie is almost certainly set to `SameSite=Lax` or `SameSite=Strict`, defeating traditional cross-site request forgery attacks from external domains. **This is the primary obstacle to overcome.**

---

## 3.0 Attack Vectors & Protocols

### 3.1 Vector 1: Client-Side Parameter Manipulation
*   **Doctrine:** The application trusts client-provided parameters more than it should.
*   **Protocol:**
    1.  Deploy `HailuoKit` userscript.
    2.  Enable "Force Max Images" in the control panel.
    3.  Initiate an image generation request for any number of images (e.g., 4).
    4.  The script will intercept and modify both the API call and the corresponding analytics event, changing `imageNum` to `9`.
*   **Expected Outcome:** Successful generation of 9 images, bypassing server-side controls. **Status: Believed to be ACTIVE.**

### 3.2 Vector 2: `postMessage` Induced CSRF (Primary Objective)
*   **Doctrine:** The `SameSite` cookie defense is only effective against requests originating from a *different* site. If we can find a `postMessage` listener on `hailuoai.video` that can be tricked into initiating a request on our behalf, that request will originate from the trusted domain, and the browser **will** attach the session cookie.
*   **Protocol:** This protocol combines reconnaissance (`FancyTracker`) with exploitation.

    **Phase A: Vulnerability Identification (FancyTracker Recon)**
    1.  Deploy the `FancyTracker` extension. Disable the "Global Kill Switch" for this phase.
    2.  Systematically navigate every feature of the target application. Pay extreme attention to features that involve third-party integrations, popups, or iframes (e.g., login with Google, support widgets, embedded media).
    3.  Review the `FancyTracker` logs. Hunt for a listener that meets the following criteria:
        *   **Weak Origin Validation:** It either has no `event.origin` check, a wildcard (`*`) check, or a flawed regex that can be bypassed.
        *   **Actionable Payload:** It takes the `event.data` and performs an action, such as making an API call, setting an iframe's `src`, or updating the DOM.

    **Phase B: Payload Formulation & Execution**
    1.  Once a vulnerable listener is identified, construct a proof-of-concept HTML page (`pm_csrf_poc.html`).
    2.  This page will contain JavaScript that opens the target site in a popup/iframe and uses `postMessage` to send a malicious payload to the vulnerable listener.
    3.  **The Golden Payload:** The data sent via `postMessage` must be crafted to cause the listener to execute the CSRF attack for us. Example:

    ```javascript
    // Inside pm_csrf_poc.html
    const targetWindow = window.open('https://hailuoai.video/create/image-generation');

    // Wait for the window to load
    setTimeout(() => {
        // This payload assumes we found a listener that takes a URL and fetches it.
        const maliciousPayload = {
            action: 'fetchAPI',
            url: 'https://hailuoai.video/v1/api/multimodal/generate/image',
            method: 'POST',
            body: { // The listener must be able to handle this structure
                desc: "CSRF via postMessage",
                imageNum: 4,
                modelId: "357494498567225344",
                // ... etc
            }
        };

        // Send the message to the vulnerable window
        targetWindow.postMessage(maliciousPayload, '*'); // Or the vulnerable origin
    }, 5000); // Adjust delay as needed
    ```

*   **Expected Outcome:** The vulnerable listener on `hailuoai.video` receives our message and executes the `fetch` request. Because the request originates from the target's own domain, the `SameSite` cookie is attached, and the image is generated. **Status: Unconfirmed, High Priority.**

---

## 4.0 Operational Security (OPSEC)

*   All engagement activity must be conducted from behind the approved VPN, with the `ufw.sh` kill switch active.
*   User-Agent strings should be periodically rotated to mimic common browser profiles.
*   Browser state (cache, cookies, local storage) should be cleared between major testing phases to avoid cross-contamination of sessions.

---

## 5.0 Engagement Roadmap

1.  **Confirm Vector 1:** Execute the HailuoKit "Force Max Images" protocol to confirm our client-side bypass is still effective.
2.  **Execute Vector 2 (Phase A):** Deploy `FancyTracker` and perform a full-site reconnaissance for `postMessage` listeners.
3.  **Analyze & Report:** Analyze the `FancyTracker` logs for candidate vulnerabilities.
4.  **Execute Vector 2 (Phase B):** If a candidate is found, construct and launch the `postMessage`-to-CSRF chained exploit.
5.  **Report Findings:** Document the success or failure of all protocols for strategic review.

Based on original code by [Frans Rosén](https://twitter.com/fransrosen), adapted under the MIT License.
