{{- /* Helper template for fullname */ -}}
{{- define "poc.name" -}}
{{- default .Chart.Name .Values.nameOverride -}}
{{- end -}}

{{- define "poc.fullname" -}}
{{- $name := include "poc.name" . -}}
{{- printf "%s-%s" $name .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
