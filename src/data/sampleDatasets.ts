export interface SamplePreset {
  id: string;
  name: string;
  description: string;
  data: any;
}

export const SAMPLE_DATASETS: SamplePreset[] = [
  {
    id: 'budget-allocation',
    name: 'Enterprise CAPEX Budget & Allocations',
    description: 'Corporate budget ledger and document attachments from active procurement audit',
    data: {
      attachments: [
        {
          content_type: 'application/pdf',
          file_name: '[BRD] Project BDD.pdf',
          size_bytes: 940302,
          storage_path: 'uploads/43b83d8e-3f7c-473a-9135-5df5995362d9/revision-1/01-9aa084a1-BRD_Project_BDD.pdf',
          storage_status: 'stored_locally'
        },
        {
          content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          file_name: 'allocation_bundles_sample.xlsx',
          size_bytes: 9631,
          storage_path: 'uploads/43b83d8e-3f7c-473a-9135-5df5995362d9/revision-1/02-f4d25782-allocation_bundles_sample.xlsx',
          storage_status: 'stored_locally'
        }
      ],
      fiscal_years: [
        {
          year: 2026,
          currency: 'PHP',
          allocations: [
            {
              activity_code: '129',
              activity_description: '',
              activity_name: 'Leased Asset',
              approved_budget_amount: '159000',
              budget_available: true,
              bundle_class: 'CAPEX',
              bundle_subclass: 'Leased Asset',
              requested_vat_ex: '100000'
            },
            {
              activity_code: '40',
              activity_description: '',
              activity_name: 'Low Value Assets',
              approved_budget_amount: '153000',
              budget_available: true,
              bundle_class: 'CAPEX',
              bundle_subclass: 'Low Value Assets',
              requested_vat_ex: '120000'
            },
            {
              activity_code: '110',
              activity_description: '',
              activity_name: 'Motor Vehicle',
              approved_budget_amount: '96000',
              budget_available: true,
              bundle_class: 'CAPEX',
              bundle_subclass: 'Motor Vehicle',
              requested_vat_ex: '96000'
            }
          ]
        }
      ]
    }
  },
  {
    id: 'cloud-run-service',
    name: 'Google Cloud Run Service Spec',
    description: 'Production Knative service manifest for Cloud Run deployment and container sizing',
    data: {
      apiVersion: 'serving.knative.dev/v1',
      kind: 'Service',
      metadata: {
        name: 'corporate-json-viewer',
        namespace: 'corporate-prod-asia-east1',
        annotations: {
          'run.googleapis.com/ingress': 'all',
          'run.googleapis.com/minScale': '1',
          'run.googleapis.com/maxScale': '10'
        },
        labels: {
          tier: 'frontend-inspection',
          environment: 'production'
        }
      },
      spec: {
        template: {
          metadata: {
            annotations: {
              'autoscaling.knative.dev/maxScale': '10',
              'run.googleapis.com/client-name': 'gcloud'
            }
          },
          spec: {
            containerConcurrency: 80,
            timeoutSeconds: 300,
            serviceAccountName: 'cloud-run-exec@corporate-prod.iam.gserviceaccount.com',
            containers: [
              {
                image: 'gcr.io/corporate-prod/json-viewer:v1.2.0',
                ports: [
                  {
                    name: 'http1',
                    containerPort: 8080
                  }
                ],
                resources: {
                  limits: {
                    cpu: '1000m',
                    memory: '512Mi'
                  }
                },
                env: [
                  {
                    name: 'NODE_ENV',
                    value: 'production'
                  },
                  {
                    name: 'PORT',
                    value: '8080'
                  }
                ],
                startupProbe: {
                  httpGet: {
                    path: '/healthz',
                    port: 8080
                  },
                  failureThreshold: 3,
                  periodSeconds: 10
                }
              }
            ]
          }
        },
        traffic: [
          {
            percent: 100,
            latestRevision: true
          }
        ]
      }
    }
  },
  {
    id: 'gcp-audit-log',
    name: 'Cloud Audit & IAM Security Log',
    description: 'Structured enterprise audit entry for role assignment and resource access',
    data: {
      protoPayload: {
        '@type': 'type.googleapis.com/google.cloud.audit.AuditLog',
        status: {},
        authenticationInfo: {
          principalEmail: 'admin-secops@enterprise-corp.com',
          principalSubject: 'user:admin-secops@enterprise-corp.com'
        },
        requestMetadata: {
          callerIp: '136.144.40.18',
          callerSuppliedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          requestAttributes: {
            time: '2026-10-14T18:30:00Z',
            auth: {
              audience: 'https://iam.googleapis.com/'
            }
          }
        },
        serviceName: 'iam.googleapis.com',
        methodName: 'google.iam.v1.SetIamPolicy',
        resourceName: 'projects/corp-finance-2026',
        authorizationInfo: [
          {
            resource: 'projects/corp-finance-2026',
            permission: 'resourcemanager.projects.setIamPolicy',
            granted: true
          }
        ]
      },
      insertId: '1c09893b8f2d4e8790b',
      resource: {
        type: 'project',
        labels: {
          project_id: 'corp-finance-2026'
        }
      },
      timestamp: '2026-10-14T18:30:00.124Z',
      severity: 'NOTICE',
      logName: 'projects/corp-finance-2026/logs/cloudaudit.googleapis.com%2Factivity'
    }
  }
];
