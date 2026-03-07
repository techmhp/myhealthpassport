\# MHP2 — CI/CD Pipeline Documentation



\*\*Project:\*\* MHP2  

\*\*Date:\*\* February 13, 2026  

\*\*Version:\*\* 1.0  



---



\## 1. Overview



This document outlines the CI/CD pipeline architecture for the MHP2 project. The pipeline automates code synchronization, build, deployment, and cache invalidation across UAT and Production environments hosted on AWS.



---



\## 2. Technology Stack



|

&nbsp;Component         

|

&nbsp;Technology                     

|

|

--------------------

|

-------------------------------

|

|

&nbsp;Frontend Framework 

|

&nbsp;React + Vite + TypeScript     

|

|

&nbsp;UI Library         

|

&nbsp;shadcn/ui + Tailwind CSS      

|

|

&nbsp;Source Control     

|

&nbsp;GitHub                        

|

|

&nbsp;CI/CD              

|

&nbsp;GitHub Actions                

|

|

&nbsp;Hosting            

|

&nbsp;AWS S3 + CloudFront           

|

|

&nbsp;Region             

|

&nbsp;ap-south-1 (Mumbai)           

|



---



\## 3. Branching Strategy



|

&nbsp;Branch    

|

&nbsp;Purpose                                      

|

|

-----------

|

-----------------------------------------------

|

|

`main`

|

&nbsp;Primary development branch (Lovable pushes here) 

|

|

`staging`

|

&nbsp;UAT deployment branch (auto-synced from 

`main`

) 

|



\### Flow

Lovable → main → (auto-merge) → staging → (auto-deploy) → UAT ↓ Manual trigger → Production





---



\## 4. AWS Infrastructure



\### 4.1 UAT Environment



| Resource    | Value                  |

|-------------|------------------------|

| S3 Bucket   | `mhp-uat`             |

| CloudFront  | Distribution `EVF2MJYSV3EHO` |



\### 4.2 Production Environment



| Resource    | Value                  |

|-------------|------------------------|

| S3 Bucket   | `mhp-production`      |

| CloudFront  | Distribution `E3B92WOD20KCJ3` |



---



\## 5. GitHub Actions Workflows



\### 5.1 Sync to Staging (`sync-to-staging.yml`)



\- \*\*Trigger:\*\* Push to `main`

\- \*\*Action:\*\* Automatically merges `main` into `staging`

\- \*\*Purpose:\*\* Keeps the staging branch continuously up-to-date with the latest code



\### 5.2 Deploy to UAT (`deploy-uat.yml`)



\- \*\*Trigger:\*\* Push to `staging`

\- \*\*Actions:\*\*

&nbsp; 1. Checkout code

&nbsp; 2. Install dependencies

&nbsp; 3. Build the project (`npm run build`)

&nbsp; 4. Sync build output to S3 bucket `mhp-uat`

&nbsp; 5. Invalidate CloudFront cache (Distribution `EVF2MJYSV3EHO`)

\- \*\*Purpose:\*\* Automated deployment to UAT for testing and validation



\### 5.3 Deploy to Production (`deploy-prod.yml`)



\- \*\*Trigger:\*\* Manual (`workflow\_dispatch`)

\- \*\*Actions:\*\*

&nbsp; 1. Checkout code from `staging`

&nbsp; 2. Install dependencies

&nbsp; 3. Build the project

&nbsp; 4. Sync build output to S3 bucket `mhp-production`

&nbsp; 5. Invalidate CloudFront cache (Distribution `E3B92WOD20KCJ3`)

\- \*\*Purpose:\*\* Controlled production release after UAT regression testing



---



\## 6. Required Secrets \& Permissions



\### 6.1 GitHub Repository Secrets



| Secret             | Description                                      |

|--------------------|--------------------------------------------------|

| `PAT\_TOKEN`        | Personal Access Token with `repo` scope — required for sync workflow to trigger downstream workflows |

| `AWS\_ACCESS\_KEY\_ID`     | AWS IAM access key for S3 and CloudFront access |

| `AWS\_SECRET\_ACCESS\_KEY` | AWS IAM secret key                              |



\### 6.2 GitHub Repository Settings



| Setting              | Value               |

|----------------------|----------------------|

| Workflow permissions | Read and write       |



> \*\*Note:\*\* The `PAT\_TOKEN` is necessary because the default `GITHUB\_TOKEN` cannot trigger other workflows. A PAT with `repo` scope allows the sync workflow to trigger the deployment workflow.



---



\## 7. Deployment Flow — Step by Step



\### UAT (Automated)



1\. Developer makes changes in Lovable (or pushes to `main` via Git)

2\. `sync-to-staging.yml` triggers → merges `main` into `staging`

3\. `deploy-uat.yml` triggers → builds and deploys to S3 (`mhp-uat`)

4\. CloudFront cache is invalidated → latest version is live on UAT



\### Production (Manual)



1\. QA completes regression testing on UAT

2\. Authorized team member triggers `deploy-prod.yml` via GitHub Actions (workflow\_dispatch)

3\. Code is built from `staging` and deployed to S3 (`mhp-production`)

4\. CloudFront cache is invalidated → latest version is live on Production



---



\## 8. Architecture Diagram



┌─────────────┐ │ Lovable │ │ (Dev IDE) │ └──────┬──────┘ │ push ▼ ┌─────────────┐ auto-merge ┌─────────────┐ │ main │ ───────────────► │ staging │ │ (branch) │ sync-to-staging │ (branch) │ └─────────────┘ └──────┬───────┘ │ push ▼ ┌──────────────┐ │ deploy-uat │ │ (workflow) │ └──────┬───────┘ │ ┌──────────┴──────────┐ ▼ ▼ ┌──────────┐ ┌─────────────┐ │ S3: UAT │ │ CloudFront │ │ mhp-uat │───────►│ EVF2MJY... │ └──────────┘ └─────────────┘



&nbsp;                   ── Manual Trigger ──



&nbsp;                             ┌──────────────┐

&nbsp;                             │ deploy-prod  │

&nbsp;                             │  (workflow)  │

&nbsp;                             └──────┬───────┘

&nbsp;                                    │

&nbsp;                         ┌──────────┴──────────┐

&nbsp;                         ▼                     ▼

&nbsp;                   ┌──────────┐        ┌─────────────┐

&nbsp;                   │ S3: Prod │        │ CloudFront  │

&nbsp;                   │mhp-prod  │───────►│ E3B92WO...  │

&nbsp;                   └──────────┘        └─────────────┘



---



\## 9. Troubleshooting



| Issue | Cause | Resolution |

|-------|-------|------------|

| Sync workflow doesn't trigger deploy | `GITHUB\_TOKEN` used instead of `PAT\_TOKEN` | Ensure `PAT\_TOKEN` secret is configured with `repo` scope |

| Deploy fails on S3 sync | Invalid AWS credentials | Verify `AWS\_ACCESS\_KEY\_ID` and `AWS\_SECRET\_ACCESS\_KEY` secrets |

| Old content served after deploy | CloudFront cache not invalidated | Check CloudFront invalidation step in workflow logs |

| Workflow permissions error | Insufficient permissions | Set workflow permissions to "Read and write" in repo settings |



---



\## 10. Contacts



| Role | Name |

|------|------|

| CTO | Yakub |



| DevOps Lead | Durga |



---



\*Document maintained by the MHP2 Infra Team.\*

